import type { UseCase } from '#shared/interfaces/use-case'
import type { DocumentValidationDocument } from '../../document-engine/domain/entities'
import { DocumentValidationStatus } from '../../document-engine/domain/structures'
import type { DocumentValidationsRepository } from '../../document-engine/interfaces'
import { DocumentGenerationRequestedEvent } from '../../document-production/domain/events'
import type { DocumentSpecification } from '../../document-production/domain/entities'
import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
  type DocumentGenerationSource,
} from '../../document-production/domain/structures'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentSpecificationsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import type { CollaboratorProfile as CollaboratorProfileValue } from '#shared/domain/structures'
import type { ClientsRepository } from '../../identity/interfaces'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseStatus,
} from '../domain/structures'
import { LegalCaseDocumentGenerationError } from '../domain/errors/legal-case-document-generation-error'
import { LegalCaseNotFoundError } from '../domain/errors/legal-case-not-found-error'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../interfaces'
import type { CaseAccessProvider } from '../interfaces'
import { CaseAccessIntent } from '../domain/structures'
import type { Broker, DatetimeProvider, IdProvider } from '../../shared/interfaces'
import type { LegalCase } from '../domain/entities'
import type { Client } from '../../identity/domain/entities'

type Request = {
  caseId: string
  documentSpecificationId: string
  documentFileIds: readonly string[]
  requestedByCollaboratorId: string
  requestedByCollaboratorProfile: CollaboratorProfileValue
  instructions?: string
}

type Response = {
  documentGenerationId: string
  documentId: string
}
type NormalizedField = { normalizedLabel: string; value: string }
type TemplateVariableContext = {
  caseCode: string
  caseTitle: string
  clientName: string
  fields: readonly NormalizedField[]
  documents: readonly DocumentValidationDocument[]
  occurredAt: Date
}

export class GenerateLegalCaseDocumentUseCase implements UseCase<Request, Response> {
  constructor(
    private readonly cases: LegalCasesRepository,
    private readonly checklistItems: CaseChecklistItemsRepository,
    private readonly validations: DocumentValidationsRepository,
    private readonly clients: ClientsRepository,
    private readonly packages: DocumentPackagesRepository,
    private readonly packageDocuments: PackageDocumentsRepository,
    private readonly documents: DocumentsRepository,
    private readonly specifications: DocumentSpecificationsRepository,
    private readonly broker: Broker,
    private readonly datetime: DatetimeProvider,
    private readonly ids: IdProvider,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request): Promise<Response> {
    const instructions = this.resolveInstructions(request.instructions)

    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    await this.caseAccessProvider.authorize({
      caseId: legalCase.id,
      actorId: request.requestedByCollaboratorId,
      intent: CaseAccessIntent.WriteContent,
    })
    this.assertDossierReady(legalCase)

    const inputs = await this.loadGenerationInputs(
      legalCase,
      request.documentSpecificationId,
    )
    const { client, specification } = this.validateGenerationInputs(legalCase, inputs)
    const selectedDocuments = this.resolveGenerationDocuments(
      request.documentFileIds,
      legalCase,
      inputs.checklistItems,
      inputs.validations,
    )
    return this.persistGeneration(
      request,
      legalCase,
      client,
      specification,
      selectedDocuments,
      instructions,
    )
  }

  private resolveInstructions(instructions?: string): string | undefined {
    const normalized = instructions?.trim()
    if (instructions !== undefined && !normalized) {
      throw new LegalCaseDocumentGenerationError('As instruções não podem ficar vazias.')
    }
    return normalized
  }

  private async loadGenerationInputs(legalCase: LegalCase, specificationId: string) {
    const [checklistItems, validations, client, specification] = await Promise.all([
      this.checklistItems.listByCaseId(legalCase.id),
      this.validations.list({
        caseId: legalCase.id,
        status: DocumentValidationStatus.Valid,
      }),
      this.clients.findById(legalCase.clientId),
      this.specifications.findById(specificationId),
    ])
    return { checklistItems, validations, client, specification }
  }

  private validateGenerationInputs(
    legalCase: LegalCase,
    inputs: Awaited<ReturnType<GenerateLegalCaseDocumentUseCase['loadGenerationInputs']>>,
  ): { client: Client; specification: DocumentSpecification } {
    const { client, specification, checklistItems } = inputs
    if (!client) throw new LegalCaseNotFoundError()
    if (!specification) {
      throw new LegalCaseDocumentGenerationError(
        'O modelo de peça selecionado não existe.',
      )
    }
    this.assertLegalProductionSpecification(
      specification,
      legalCase.legalAreaId,
      legalCase.legalTopicId,
    )
    this.assertRequiredChecklistComplete(legalCase.checklistGate.decision, checklistItems)
    return { client, specification }
  }

  private resolveGenerationDocuments(
    documentFileIds: readonly string[],
    legalCase: LegalCase,
    checklistItems: Awaited<ReturnType<CaseChecklistItemsRepository['listByCaseId']>>,
    validations: readonly DocumentValidationDocument[],
  ): DocumentValidationDocument[] {
    const uniqueFileIds = [...new Set(documentFileIds)]
    if (uniqueFileIds.length === 0 || uniqueFileIds.length !== documentFileIds.length) {
      throw new LegalCaseDocumentGenerationError(
        'Selecione ao menos um documento validado, sem repetir arquivos.',
      )
    }

    return this.resolveSelectedDocuments(
      uniqueFileIds,
      checklistItems,
      validations,
      legalCase.id,
    )
  }

  private async persistGeneration(
    request: Request,
    legalCase: LegalCase,
    client: Client,
    specification: DocumentSpecification,
    selectedDocuments: readonly DocumentValidationDocument[],
    instructions?: string,
  ): Promise<Response> {
    const documentPackage =
      (await this.packages.findByContext({ type: 'case', caseId: legalCase.id })) ??
      (await this.packages.add({
        id: this.ids.generate(),
        context: { type: 'case', caseId: legalCase.id },
      }))
    const documentId = this.ids.generate()
    const documentGenerationId = this.ids.generate()
    const occurredAt = this.datetime.now()
    const source = this.buildSource(
      legalCase,
      client,
      selectedDocuments,
      specification,
      occurredAt,
      instructions,
    )

    await this.documents.add({
      id: documentId,
      title: specification.name,
      classificacaoAcesso: 'INTERNO',
    })
    await this.packageDocuments.add({
      id: this.ids.generate(),
      documentPackageId: documentPackage.id,
      documentId,
      documentSpecificationId: specification.id,
    })
    await this.broker.publish(
      new DocumentGenerationRequestedEvent({
        documentGenerationId,
        documentId,
        documentSpecificationVersionId: specification.id,
        requestedByCollaboratorId: request.requestedByCollaboratorId,
        ...(instructions ? { instructions } : {}),
        source,
        occurredAt,
      }),
    )

    return { documentGenerationId, documentId }
  }

  private assertDossierReady(legalCase: LegalCase) {
    const approvedGate =
      legalCase.checklistGate.decision === CaseChecklistGateDecision.Approved ||
      legalCase.checklistGate.decision === CaseChecklistGateDecision.ApprovedWithException
    const productionStage =
      legalCase.status === LegalCaseStatus.ReadyForLegalProduction ||
      legalCase.status === LegalCaseStatus.LegalProduction

    if (!approvedGate || !productionStage || !legalCase.dossierGate.homologatedAt) {
      throw new LegalCaseDocumentGenerationError(
        'A geração exige o dossiê documental aprovado e a liberação da produção jurídica.',
      )
    }
  }

  private assertRequiredChecklistComplete(
    decision:
      | (typeof CaseChecklistGateDecision)[keyof typeof CaseChecklistGateDecision]
      | undefined,
    items: Awaited<ReturnType<CaseChecklistItemsRepository['listByCaseId']>>,
  ): void {
    if (decision === CaseChecklistGateDecision.ApprovedWithException) return
    const hasPendingRequiredItem = items.some(
      (item) => item.isRequired && item.status !== CaseChecklistItemStatus.Validated,
    )
    if (hasPendingRequiredItem) {
      throw new LegalCaseDocumentGenerationError(
        'O checklist possui documentos obrigatórios ainda não validados.',
      )
    }
  }

  private assertLegalProductionSpecification(
    specification: DocumentSpecification,
    legalAreaId: string,
    legalTopicId: string,
  ): void {
    if (specification.status !== DocumentSpecificationStatus.Available) {
      throw new LegalCaseDocumentGenerationError(
        'O modelo selecionado está indisponível.',
      )
    }
    if (specification.application.moment !== DocumentGenerationMoment.LegalProduction) {
      throw new LegalCaseDocumentGenerationError(
        'O modelo selecionado não está disponível para produção jurídica.',
      )
    }
    if (
      specification.application.scope === 'legal_context' &&
      (!specification.application.legalAreaIds.includes(legalAreaId) ||
        !(specification.application.legalTopicIdsByArea[legalAreaId] ?? []).includes(
          legalTopicId,
        ))
    ) {
      throw new LegalCaseDocumentGenerationError(
        'O modelo selecionado não está vinculado à área e ao tema deste caso.',
      )
    }
  }

  private resolveSelectedDocuments(
    fileIds: readonly string[],
    checklistItems: Awaited<ReturnType<CaseChecklistItemsRepository['listByCaseId']>>,
    validations: readonly DocumentValidationDocument[],
    caseId: string,
  ): DocumentValidationDocument[] {
    return fileIds.map((fileId) => {
      const checklistItem = checklistItems.find(
        (item) =>
          item.documentFileId === fileId &&
          item.status === CaseChecklistItemStatus.Validated &&
          item.validatedAt &&
          item.validatedBy,
      )
      const validation = validations.find(
        (document) =>
          document.id === fileId &&
          document.status === DocumentValidationStatus.Valid &&
          document.reviewedAt !== undefined &&
          document.reviewedBy !== undefined &&
          document.checklistLink?.caseId === caseId &&
          document.checklistLink.checklistItemId === checklistItem?.id,
      )

      if (!checklistItem || !validation) {
        throw new LegalCaseDocumentGenerationError(
          'Cada documento de referência deve estar validado e vinculado ao checklist deste caso.',
        )
      }

      return validation
    })
  }

  private buildSource(
    legalCase: LegalCase,
    client: Client,
    selectedDocuments: readonly DocumentValidationDocument[],
    specification: DocumentSpecification,
    occurredAt: Date,
    instructions?: string,
  ): DocumentGenerationSource {
    const extractedFields = selectedDocuments.flatMap((document) =>
      document.extractedFields
        .filter((field) => !field.isMissing && field.value.trim())
        .map((field) => ({
          label: field.label,
          value: field.value.trim(),
          sourceDocumentId: document.id,
          sourceDocumentName: document.fileName,
          confidence: field.confidence,
        })),
    )
    const templateVariableValues = this.resolveTemplateVariables(
      specification,
      legalCase.publicCode,
      legalCase.title,
      client.type === 'natural' ? client.name : client.legalName,
      extractedFields,
      selectedDocuments,
      occurredAt,
    )

    return {
      type: 'case',
      id: legalCase.id,
      data: {
        case: {
          id: legalCase.id,
          publicCode: legalCase.publicCode,
          title: legalCase.title,
          legalAreaId: legalCase.legalAreaId,
          legalTopicId: legalCase.legalTopicId,
          checklistGate: legalCase.checklistGate,
          dossierGate: legalCase.dossierGate,
        },
        client: {
          id: client.id,
          type: client.type,
          name: client.type === 'natural' ? client.name : client.legalName,
          taxId: client.taxId,
          address: client.address,
        },
        referenceDocuments: selectedDocuments.map((document) => ({
          id: document.id,
          fileName: document.fileName,
          checklistItemId: document.checklistLink?.checklistItemId,
          checklistItemLabel: document.checklistLink?.checklistItemLabel,
          reviewedBy: document.reviewedBy,
          reviewedAt: document.reviewedAt?.toISOString(),
          validationStatus: document.status,
          extractedFields: document.extractedFields,
        })),
        extractedFacts: extractedFields,
        templateVariableValues,
        ...(instructions ? { generationInstructions: instructions } : {}),
      },
    }
  }

  private resolveTemplateVariables(
    specification: DocumentSpecification,
    caseCode: string,
    caseTitle: string,
    clientName: string,
    fields: readonly { label: string; value: string }[],
    documents: readonly DocumentValidationDocument[],
    occurredAt: Date,
  ): Record<string, string> {
    const values: Record<string, string> = {}
    const context: TemplateVariableContext = {
      caseCode,
      caseTitle,
      clientName,
      fields: fields.map((field) => ({
        ...field,
        normalizedLabel: this.normalize(field.label),
      })),
      documents,
      occurredAt,
    }
    const resolvers = this.getTemplateVariableResolvers(context)

    for (const variable of specification.variables) {
      const value = resolvers[variable.technicalName.toLowerCase()]?.()
      if (value?.trim()) values[variable.technicalName] = value.trim()
    }
    return values
  }

  private getTemplateVariableResolvers(
    context: TemplateVariableContext,
  ): Record<string, () => string | undefined> {
    return {
      ...this.getApplicantVariableResolvers(context),
      ...this.getCaseVariableResolvers(context),
      ...this.getDocumentVariableResolvers(context),
      ...this.getRepresentativeVariableResolvers(context),
    }
  }

  private getApplicantVariableResolvers(
    context: TemplateVariableContext,
  ): Record<string, () => string | undefined> {
    const find = (aliases: readonly string[]) => this.findField(context.fields, aliases)
    return {
      nome_requerente: () =>
        find(['cliente', 'nome do requerente', 'requerente', 'titular']) ??
        context.clientName,
      cpf_requerente: () =>
        find(['cpf', 'cpf cnpj', 'cpf do requerente', 'documento de identificacao']),
      nit_requerente: () => find(['nit', 'pis', 'pasep', 'nit pis pasep']),
      endereco_requerente: () =>
        find(['endereco do requerente', 'endereco de instalacao', 'endereco']),
      beneficio_requerido: () =>
        find(['beneficio requerido', 'beneficio']) ?? context.caseTitle,
      periodos_contributivos: () =>
        find([
          'periodos contributivos',
          'tempo de contribuicao',
          'periodo de contribuicao',
        ]),
    }
  }

  private getCaseVariableResolvers(
    context: TemplateVariableContext,
  ): Record<string, () => string | undefined> {
    return {
      municipio: () =>
        this.findField(context.fields, ['municipio', 'cidade uf', 'cidade'])
          ?.split('/')[0]
          ?.trim(),
      data_documento: () =>
        new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'long',
        }).format(context.occurredAt),
      numero_caso: () => context.caseCode,
    }
  }

  private getDocumentVariableResolvers(
    context: TemplateVariableContext,
  ): Record<string, () => string | undefined> {
    return {
      documentos_apresentados: () =>
        context.documents.map(({ fileName }) => fileName).join('; '),
    }
  }

  private getRepresentativeVariableResolvers(
    context: TemplateVariableContext,
  ): Record<string, () => string | undefined> {
    const find = (aliases: readonly string[]) => this.findField(context.fields, aliases)
    return {
      nome_representante: () => find(['outorgado', 'procurador', 'representante']),
      uf_oab: () => find(['uf oab', 'estado oab']),
      numero_oab: () => find(['numero oab', 'oab']),
    }
  }

  private findField(
    fields: readonly NormalizedField[],
    aliases: readonly string[],
  ): string | undefined {
    const normalizedAliases = aliases.map((alias) => this.normalize(alias))
    return fields.find((field) => normalizedAliases.includes(field.normalizedLabel))
      ?.value
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  }
}
