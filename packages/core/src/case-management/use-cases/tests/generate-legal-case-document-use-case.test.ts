import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentValidationDocumentFaker } from '../../../document-engine/domain/entities/fakers'
import { DocumentValidationStatus } from '../../../document-engine/domain/structures'
import { DocumentSpecificationFaker } from '../../../document-production/domain/entities/fakers'
import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '../../../document-production/domain/structures'
import type {
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentSpecificationsRepository,
  PackageDocumentsRepository,
} from '../../../document-production/interfaces'
import { ClientFaker } from '../../../identity/domain/entities/fakers'
import type { ClientsRepository } from '../../../identity/interfaces'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import {
  CaseChecklistGateDecision,
  CaseChecklistItemStatus,
  LegalCaseLifecycleStatus,
  LegalCaseStatus,
} from '../../domain/structures'
import type {
  CaseAccessProvider,
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '../../interfaces'
import type { DocumentValidationsRepository } from '../../../document-engine/interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'
import { GenerateLegalCaseDocumentUseCase } from '../generate-legal-case-document-use-case'

describe('Generate Legal Case Document Use Case', () => {
  let cases: MockProxy<LegalCasesRepository>
  let checklist: MockProxy<CaseChecklistItemsRepository>
  let validations: MockProxy<DocumentValidationsRepository>
  let clients: MockProxy<ClientsRepository>
  let packages: MockProxy<DocumentPackagesRepository>
  let packageDocuments: MockProxy<PackageDocumentsRepository>
  let documents: MockProxy<DocumentsRepository>
  let specifications: MockProxy<DocumentSpecificationsRepository>
  let broker: MockProxy<Broker>
  let datetime: MockProxy<DatetimeProvider>
  let ids: MockProxy<IdProvider>
  let access: MockProxy<CaseAccessProvider>
  let useCase: GenerateLegalCaseDocumentUseCase

  beforeEach(() => {
    cases = mock<LegalCasesRepository>()
    checklist = mock<CaseChecklistItemsRepository>()
    validations = mock<DocumentValidationsRepository>()
    clients = mock<ClientsRepository>()
    packages = mock<DocumentPackagesRepository>()
    packageDocuments = mock<PackageDocumentsRepository>()
    documents = mock<DocumentsRepository>()
    specifications = mock<DocumentSpecificationsRepository>()
    broker = mock<Broker>()
    datetime = mock<DatetimeProvider>()
    ids = mock<IdProvider>()
    access = mock<CaseAccessProvider>()
    access.authorize.mockResolvedValue()
    useCase = new GenerateLegalCaseDocumentUseCase(
      cases,
      checklist,
      validations,
      clients,
      packages,
      packageDocuments,
      documents,
      specifications,
      broker,
      datetime,
      ids,
      access,
    )
  })

  it('publishes an AI draft request with fields from validated checklist documents', async () => {
    const caseId = '9d2977fa-cb81-40a3-aab0-c26dd051130d'
    const actorId = '11111111-1111-4111-8111-111111111111'
    const fileId = '22222222-2222-4222-8222-222222222222'
    const checklistItemId = '33333333-3333-4333-8333-333333333333'
    const generatedAt = new Date('2026-09-24T12:00:00.000Z')
    const legalCase = LegalCaseFaker.fake({
      id: caseId,
      clientId: '44444444-4444-4444-8444-444444444444',
      title: 'Aposentadoria por tempo de contribuição',
      workflowStage: LegalCaseStatus.LegalProduction,
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      dossierGate: { homologatedAt: new Date('2026-09-14T12:00:00.000Z') },
    })
    const client = ClientFaker.fake({ name: 'Helena Maria de Albuquerque Costa' })
    const specification = DocumentSpecificationFaker.fake({
      id: '88888888-8888-4888-8888-888888888888',
      variables: [
        { label: 'Nome do requerente', technicalName: 'nome_requerente' },
        { label: 'CPF do requerente', technicalName: 'cpf_requerente' },
        { label: 'NIT', technicalName: 'nit_requerente' },
        { label: 'Endereço', technicalName: 'endereco_requerente' },
        { label: 'Benefício', technicalName: 'beneficio_requerido' },
        { label: 'Períodos contributivos', technicalName: 'periodos_contributivos' },
        { label: 'Município', technicalName: 'municipio' },
        { label: 'Data do documento', technicalName: 'data_documento' },
        { label: 'Número do caso', technicalName: 'numero_caso' },
        { label: 'Documentos apresentados', technicalName: 'documentos_apresentados' },
        { label: 'Nome do representante', technicalName: 'nome_representante' },
        { label: 'UF OAB', technicalName: 'uf_oab' },
        { label: 'Número OAB', technicalName: 'numero_oab' },
        { label: 'Campo não mapeado', technicalName: 'campo_nao_mapeado' },
      ],
      status: DocumentSpecificationStatus.Available,
      application: {
        scope: 'legal_context',
        moment: 'legal_production',
        legalAreaIds: [legalCase.legalAreaId],
        legalTopicIdsByArea: { [legalCase.legalAreaId]: [legalCase.legalTopicId] },
      },
    })
    const validation = DocumentValidationDocumentFaker.fake({
      id: fileId,
      fileName: 'conta-luz.pdf',
      status: DocumentValidationStatus.Valid,
      reviewedBy: actorId,
      reviewedAt: generatedAt,
      checklistLink: {
        caseId,
        checklistItemId,
        checklistItemLabel: 'Comprovante de residência',
      },
      extractedFields: [
        {
          label: 'Cliente CPF/CNPJ',
          value: 'rótulo contaminado com valor incorreto',
          confidence: 0.4,
        },
        {
          label: 'Cliente',
          value: 'Helena Maria de Albuquerque Costa',
          confidence: 0.98,
        },
        { label: 'CPF/CNPJ', value: '123.456.789-09', confidence: 0.98 },
        { label: 'Cidade/UF', value: 'São José dos Campos / SP', confidence: 0.98 },
        { label: 'NIT', value: '123.45678.90-1', confidence: 0.98 },
        { label: 'Endereço', value: 'Rua Central, 100', confidence: 0.98 },
        { label: 'Benefício', value: 'Aposentadoria especial', confidence: 0.98 },
        { label: 'Período de contribuição', value: '2001 a 2020', confidence: 0.98 },
        { label: 'Outorgado', value: 'Maria Advogada', confidence: 0.98 },
        { label: 'Estado OAB', value: 'SP', confidence: 0.98 },
        { label: 'Número OAB', value: '123456', confidence: 0.98 },
        { label: 'Campo ausente', value: '  ', confidence: 0.98 },
        {
          label: 'Campo marcado como ausente',
          value: 'não usar',
          confidence: 0.1,
          isMissing: true,
        },
      ],
    })
    const generationId = '55555555-5555-4555-8555-555555555555'
    const documentId = '66666666-6666-4666-8666-666666666666'
    const packageId = '77777777-7777-4777-8777-777777777777'
    cases.findById.mockResolvedValue(legalCase)
    checklist.listByCaseId.mockResolvedValue([
      {
        id: checklistItemId,
        caseId,
        templateItemKey: 'address-proof',
        title: 'Comprovante de residência',
        isRequired: true,
        status: CaseChecklistItemStatus.Validated,
        documentFileId: fileId,
        documentFileName: 'conta-luz.pdf',
        validatedAt: generatedAt,
        validatedBy: actorId,
        createdAt: generatedAt,
        updatedAt: generatedAt,
      },
    ])
    validations.list.mockResolvedValue([validation])
    clients.findById.mockResolvedValue(client)
    specifications.findById.mockResolvedValue(specification)
    packages.findByContext.mockResolvedValue(undefined)
    packages.add.mockResolvedValue({
      id: packageId,
      context: { type: 'case', caseId },
      documents: [],
      createdAt: generatedAt,
      updatedAt: generatedAt,
    })
    ids.generate
      .mockReturnValueOnce(packageId)
      .mockReturnValueOnce(documentId)
      .mockReturnValueOnce(generationId)
    datetime.now.mockReturnValue(generatedAt)

    await useCase.execute({
      caseId,
      documentSpecificationId: specification.id,
      documentFileIds: [fileId],
      requestedByCollaboratorId: actorId,
      requestedByCollaboratorProfile: 'lawyer',
      instructions: 'Usar apenas fatos validados.',
    })

    expect(documents.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: documentId, title: specification.name }),
    )
    expect(packageDocuments.add).toHaveBeenCalledWith(
      expect.objectContaining({
        documentPackageId: packageId,
        documentId,
        documentSpecificationId: specification.id,
      }),
    )
    const event = broker.publish.mock.calls[0]?.[0]
    expect(event).toBeDefined()
    expect(
      (
        event as {
          payload: {
            source: { data: { templateVariableValues: Record<string, string> } }
          }
        }
      ).payload.source.data.templateVariableValues,
    ).toEqual(
      expect.objectContaining({
        nome_requerente: 'Helena Maria de Albuquerque Costa',
        cpf_requerente: '123.456.789-09',
        nit_requerente: '123.45678.90-1',
        endereco_requerente: 'Rua Central, 100',
        beneficio_requerido: 'Aposentadoria especial',
        periodos_contributivos: '2001 a 2020',
        municipio: 'São José dos Campos',
        numero_oab: '123456',
        numero_caso: legalCase.publicCode,
        documentos_apresentados: 'conta-luz.pdf',
        nome_representante: 'Maria Advogada',
        uf_oab: 'SP',
      }),
    )
    expect(broker.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          documentGenerationId: generationId,
          documentId,
          source: expect.objectContaining({
            type: 'case',
            id: caseId,
            data: expect.objectContaining({
              templateVariableValues: expect.any(Object),
              generationInstructions: 'Usar apenas fatos validados.',
            }),
          }),
        }),
      }),
    )

    validations.list.mockResolvedValue([{ ...validation, reviewedAt: undefined }])
    await expect(
      useCase.execute({
        caseId,
        documentSpecificationId: specification.id,
        documentFileIds: [fileId],
        requestedByCollaboratorId: actorId,
        requestedByCollaboratorProfile: 'lawyer',
      }),
    ).rejects.toThrow('Cada documento de referência deve estar validado')
  })

  it('rejects generation unless the checklist/dossier gate is approved', async () => {
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({
        id: 'case-id',
        checklistGate: {
          decision: CaseChecklistGateDecision.BlockedInsufficient,
          decidedAt: undefined,
          decidedBy: undefined,
          remarks: undefined,
        },
      }),
    )

    await expect(
      useCase.execute({
        caseId: 'case-id',
        documentSpecificationId: 'spec-id',
        documentFileIds: ['file-id'],
        requestedByCollaboratorId: 'actor-id',
        requestedByCollaboratorProfile: 'lawyer',
      }),
    ).rejects.toThrow('dossiê documental')

    expect(broker.publish).not.toHaveBeenCalled()
    expect(documents.add).not.toHaveBeenCalled()
  })

  it('rejects generation when the lifecycle is closed even if its saved stage allows production', async () => {
    const legalCase = LegalCaseFaker.fake({
      id: 'case-id',
      workflowStage: LegalCaseStatus.LegalProduction,
      lifecycleStatus: LegalCaseLifecycleStatus.Closed,
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      dossierGate: { homologatedAt: new Date('2026-09-14T12:00:00.000Z') },
    })
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: legalCase.id } as never])

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentSpecificationId: 'spec-id',
        documentFileIds: [],
        requestedByCollaboratorId: 'actor-id',
        requestedByCollaboratorProfile: 'lawyer',
      }),
    ).rejects.toThrow('dossiê documental')

    expect(broker.publish).not.toHaveBeenCalled()
    expect(documents.add).not.toHaveBeenCalled()
  })

  it('does not allow checklist exception approval to bypass dossier homologation', async () => {
    cases.findById.mockResolvedValue(
      LegalCaseFaker.fake({
        id: 'case-id',
        checklistGate: {
          decision: CaseChecklistGateDecision.ApprovedWithException,
          decidedAt: new Date('2026-09-27T12:00:00.000Z'),
          decidedBy: 'reviewer-id',
          remarks: 'Documento pendente foi justificado na análise.',
        },
        dossierGate: { homologatedAt: undefined, homologatedBy: undefined },
      }),
    )

    await expect(
      useCase.execute({
        caseId: 'case-id',
        documentSpecificationId: 'spec-id',
        documentFileIds: ['file-id'],
        requestedByCollaboratorId: 'actor-id',
        requestedByCollaboratorProfile: 'lawyer',
      }),
    ).rejects.toThrow('dossiê documental')

    expect(broker.publish).not.toHaveBeenCalled()
    expect(documents.add).not.toHaveBeenCalled()
  })

  it('denies an Admin when current case access rejects before document reads or writes', async () => {
    const legalCase = LegalCaseFaker.fake({ id: 'case-id' })
    cases.findById.mockResolvedValue(legalCase)
    access.authorize.mockRejectedValue(
      new ForbiddenError('Acesso jurídico ao Caso não autorizado.'),
    )

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        documentSpecificationId: 'spec-id',
        documentFileIds: ['file-id'],
        requestedByCollaboratorId: 'admin-id',
        requestedByCollaboratorProfile: 'admin',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError)

    expect(access.authorize).toHaveBeenCalledWith({
      caseId: legalCase.id,
      actorId: 'admin-id',
      intent: 'write_content',
    })
    expect(cases.listByTeamMember).not.toHaveBeenCalled()
    expect(checklist.listByCaseId).not.toHaveBeenCalled()
    expect(validations.list).not.toHaveBeenCalled()
    expect(packages.findByContext).not.toHaveBeenCalled()
    expect(packages.add).not.toHaveBeenCalled()
    expect(documents.add).not.toHaveBeenCalled()
    expect(packageDocuments.add).not.toHaveBeenCalled()
    expect(broker.publish).not.toHaveBeenCalled()
  })

  it('rejects missing inputs, unavailable models, incomplete checklists, and invalid references', async () => {
    const legalCase = LegalCaseFaker.fake({
      id: 'case-flow',
      workflowStage: LegalCaseStatus.LegalProduction,
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      dossierGate: { homologatedAt: new Date('2026-09-14T12:00:00.000Z') },
    })
    const request = {
      caseId: legalCase.id,
      documentSpecificationId: 'spec-flow',
      documentFileIds: ['file-flow'],
      requestedByCollaboratorId: 'actor-flow',
      requestedByCollaboratorProfile: 'lawyer' as const,
    }

    await expect(useCase.execute({ ...request, instructions: '   ' })).rejects.toThrow(
      'instruções não podem ficar vazias',
    )
    cases.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow()

    cases.findById.mockResolvedValue(legalCase)
    clients.findById.mockResolvedValue(undefined)
    await expect(useCase.execute(request)).rejects.toThrow('caso não foi encontrado')

    clients.findById.mockResolvedValue(ClientFaker.fake())
    specifications.findById.mockResolvedValue(undefined)
    checklist.listByCaseId.mockResolvedValue([])
    validations.list.mockResolvedValue([])
    await expect(useCase.execute(request)).rejects.toThrow('modelo de peça selecionado')

    const specification = DocumentSpecificationFaker.fake({
      id: request.documentSpecificationId,
      status: DocumentSpecificationStatus.Unavailable,
    })
    specifications.findById.mockResolvedValue(specification)
    await expect(useCase.execute(request)).rejects.toThrow('está indisponível')

    const availableSpecification = DocumentSpecificationFaker.fake({
      id: request.documentSpecificationId,
      status: DocumentSpecificationStatus.Available,
      application: {
        scope: 'global',
        moment: DocumentGenerationMoment.Consultation,
      },
    })
    specifications.findById.mockResolvedValue(availableSpecification)
    await expect(useCase.execute(request)).rejects.toThrow(
      'não está disponível para produção jurídica',
    )

    specifications.findById.mockResolvedValue(
      DocumentSpecificationFaker.fake({
        id: request.documentSpecificationId,
        status: DocumentSpecificationStatus.Available,
        application: {
          scope: 'legal_context',
          moment: DocumentGenerationMoment.LegalProduction,
          legalAreaIds: [],
          legalTopicIdsByArea: {},
        },
      }),
    )
    await expect(useCase.execute(request)).rejects.toThrow('não está vinculado')

    specifications.findById.mockResolvedValue(
      DocumentSpecificationFaker.fake({
        id: request.documentSpecificationId,
        status: DocumentSpecificationStatus.Available,
        application: {
          scope: 'legal_context',
          moment: DocumentGenerationMoment.LegalProduction,
          legalAreaIds: [legalCase.legalAreaId],
          legalTopicIdsByArea: { [legalCase.legalAreaId]: [] },
        },
      }),
    )
    await expect(useCase.execute(request)).rejects.toThrow('não está vinculado')

    const availableGlobalSpec = DocumentSpecificationFaker.fake({
      id: request.documentSpecificationId,
      status: DocumentSpecificationStatus.Available,
      application: {
        scope: 'global',
        moment: DocumentGenerationMoment.LegalProduction,
      },
    })
    specifications.findById.mockResolvedValue(availableGlobalSpec)
    checklist.listByCaseId.mockResolvedValue([
      { isRequired: true, status: CaseChecklistItemStatus.Pending } as never,
    ])
    await expect(useCase.execute(request)).rejects.toThrow('documentos obrigatórios')

    cases.findById.mockResolvedValue({
      ...legalCase,
      checklistGate: { decision: CaseChecklistGateDecision.ApprovedWithException },
    })
    checklist.listByCaseId.mockResolvedValue([])
    await expect(useCase.execute({ ...request, documentFileIds: [] })).rejects.toThrow(
      'Selecione ao menos um documento',
    )
    await expect(
      useCase.execute({ ...request, documentFileIds: ['file-flow', 'file-flow'] }),
    ).rejects.toThrow('Selecione ao menos um documento')
    await expect(useCase.execute(request)).rejects.toThrow(
      'Cada documento de referência deve estar validado',
    )
    expect(documents.add).not.toHaveBeenCalled()
  })
})
