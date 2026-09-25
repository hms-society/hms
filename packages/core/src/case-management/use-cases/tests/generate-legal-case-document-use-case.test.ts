import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { DocumentValidationDocumentFaker } from '../../../document-engine/domain/entities/fakers'
import { DocumentValidationStatus } from '../../../document-engine/domain/structures'
import { DocumentSpecificationFaker } from '../../../document-production/domain/entities/fakers'
import { DocumentSpecificationStatus } from '../../../document-production/domain/structures'
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
  LegalCaseStatus,
} from '../../domain/structures'
import type { CaseChecklistItemsRepository, LegalCasesRepository } from '../../interfaces'
import type { DocumentValidationsRepository } from '../../../document-engine/interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'
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
      status: LegalCaseStatus.LegalProduction,
      checklistGate: { decision: CaseChecklistGateDecision.Approved },
      dossierGate: { homologatedAt: new Date('2026-09-14T12:00:00.000Z') },
    })
    const client = ClientFaker.fake({ name: 'Helena Maria de Albuquerque Costa' })
    const specification = DocumentSpecificationFaker.fake({
      id: '88888888-8888-4888-8888-888888888888',
      variables: [
        { label: 'Nome do requerente', technicalName: 'nome_requerente' },
        { label: 'CPF do requerente', technicalName: 'cpf_requerente' },
        { label: 'Município', technicalName: 'municipio' },
        { label: 'Número do caso', technicalName: 'numero_caso' },
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
      ],
    })
    const generationId = '55555555-5555-4555-8555-555555555555'
    const documentId = '66666666-6666-4666-8666-666666666666'
    const packageId = '77777777-7777-4777-8777-777777777777'
    cases.findById.mockResolvedValue(legalCase)
    cases.listByTeamMember.mockResolvedValue([{ id: caseId } as never])
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
        municipio: 'São José dos Campos',
        numero_caso: legalCase.publicCode,
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
    cases.listByTeamMember.mockResolvedValue([{ id: 'case-id' } as never])

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
})
