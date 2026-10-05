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
import { CollaboratorProfile } from '../../identity/domain/structures'
import type { CollaboratorProfile as CollaboratorProfileValue } from '../../identity/domain/structures'
import type { ClientsRepository } from '../../identity/interfaces'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseStatus,
} from '../domain/structures'
import { LegalCaseDocumentGenerationError } from '../domain/errors/legal-case-document-generation-error'
import { LegalCaseNotFoundError } from '../domain/errors/legal-case-not-found-error'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../interfaces'
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
  ) {}

  async execute(request: Request): Promise<Response> {
    const instructions = request.instructions?.trim()
    if (request.instructions !== undefined && !instructions) {
      throw new LegalCaseDocumentGenerationError('As instruções não podem ficar vazias.')
    }

    const legalCase = await this.cases.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    await this.assertCaseAccess(request, legalCase.id)
    this.assertDossierReady(legalCase)

    const [checklistItems, validations, client, specification] = await Promise.all([
      this.checklistItems.listByCaseId(legalCase.id),
      this.validations.list({
        caseId: legalCase.id,
        status: DocumentValidationStatus.Valid,
      }),
      this.clients.findById(legalCase.clientId),
      this.specifications.findById(request.documentSpecificationId),
    ])
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

    const uniqueFileIds = [...new Set(request.documentFileIds)]
    if (
      uniqueFileIds.length === 0 ||
      uniqueFileIds.length !== request.documentFileIds.length
    ) {
      throw new LegalCaseDocumentGenerationError(
        'Selecione ao menos um documento validado, sem repetir arquivos.',
      )
    }

    const selectedDocuments = this.resolveSelectedDocuments(
      uniqueFileIds,
      checklistItems,
      validations,
      legalCase.id,
    )

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

  private async assertCaseAccess(request: Request, caseId: string): Promise<void> {
    if (request.requestedByCollaboratorProfile === CollaboratorProfile.Admin) return

    const assignedCases = await this.cases.listByTeamMember(
      request.requestedByCollaboratorId,
    )
    if (!assignedCases.some((assignedCase) => assignedCase.id === caseId)) {
      throw new LegalCaseNotFoundError()
    }
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
    const normalizedFields = fields.map((field) => ({
      ...field,
      normalizedLabel: this.normalize(field.label),
    }))

    for (const variable of specification.variables) {
      const key = variable.technicalName.toLowerCase()
      let value: string | undefined

      if (key === 'nome_requerente') {
        value =
          this.findField(normalizedFields, [
            'cliente',
            'nome do requerente',
            'requerente',
            'titular',
          ]) ?? clientName
      } else if (key === 'cpf_requerente') {
        value = this.findField(normalizedFields, [
          'cpf',
          'cpf cnpj',
          'cpf do requerente',
          'documento de identificacao',
        ])
      } else if (key === 'nit_requerente') {
        value = this.findField(normalizedFields, ['nit', 'pis', 'pasep', 'nit pis pasep'])
      } else if (key === 'endereco_requerente') {
        value = this.findField(normalizedFields, [
          'endereco do requerente',
          'endereco de instalacao',
          'endereco',
        ])
      } else if (key === 'beneficio_requerido') {
        value =
          this.findField(normalizedFields, ['beneficio requerido', 'beneficio']) ??
          caseTitle
      } else if (key === 'periodos_contributivos') {
        value = this.findField(normalizedFields, [
          'periodos contributivos',
          'tempo de contribuicao',
          'periodo de contribuicao',
        ])
      } else if (key === 'documentos_apresentados') {
        value = documents.map(({ fileName }) => fileName).join('; ')
      } else if (key === 'municipio') {
        const city = this.findField(normalizedFields, [
          'municipio',
          'cidade uf',
          'cidade',
        ])
        value = city?.split('/')[0]?.trim()
      } else if (key === 'data_documento') {
        value = new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'long',
        }).format(occurredAt)
      } else if (key === 'numero_caso') {
        value = caseCode
      } else if (key === 'nome_representante') {
        value = this.findField(normalizedFields, [
          'outorgado',
          'procurador',
          'representante',
        ])
      } else if (key === 'uf_oab') {
        value = this.findField(normalizedFields, ['uf oab', 'estado oab'])
      } else if (key === 'numero_oab') {
        value = this.findField(normalizedFields, ['numero oab', 'oab'])
      }

      if (value?.trim()) values[variable.technicalName] = value.trim()
    }

    return values
  }

  private findField(
    fields: readonly { normalizedLabel: string; value: string }[],
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
