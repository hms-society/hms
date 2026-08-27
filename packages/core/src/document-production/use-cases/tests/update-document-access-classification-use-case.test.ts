import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { UpdateDocumentAccessClassificationUseCase } from '../update-document-access-classification-use-case'
import type { DocumentsRepository } from '../../interfaces/documents-repository'
import type { PackageDocumentsRepository } from '../../interfaces/package-documents-repository'
import type { DocumentPackagesRepository } from '../../interfaces/document-packages-repository'
import type { ConsultationsRepository } from '../../../consultation/interfaces/consultations-repository'
import { CollaboratorProfile } from '../../../identity/domain/structures/collaborator-profile'

describe('Update Document Access Classification Use Case', () => {
  let documentsRepository: MockProxy<DocumentsRepository>
  let packageDocumentsRepository: MockProxy<PackageDocumentsRepository>
  let documentPackagesRepository: MockProxy<DocumentPackagesRepository>
  let consultationsRepository: MockProxy<ConsultationsRepository>
  let useCase: UpdateDocumentAccessClassificationUseCase

  beforeEach(() => {
    documentsRepository = mock<DocumentsRepository>()
    packageDocumentsRepository = mock<PackageDocumentsRepository>()
    documentPackagesRepository = mock<DocumentPackagesRepository>()
    consultationsRepository = mock<ConsultationsRepository>()

    useCase = new UpdateDocumentAccessClassificationUseCase(
      documentsRepository,
      packageDocumentsRepository,
      documentPackagesRepository,
      consultationsRepository,
    )
  })

  it('raises an error when document is not found', async () => {
    documentsRepository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        documentId: 'doc-1',
        userId: 'user-1',
        collaboratorId: 'collab-1',
        collaboratorProfile: CollaboratorProfile.Lawyer,
        newClassification: 'CLIENTE',
      }),
    ).rejects.toThrow('Documento não encontrado.')
  })

  it('raises an error when document is not linked to a package', async () => {
    documentsRepository.findById.mockResolvedValue({
      classificacaoAcesso: 'INTERNO',
    } as any)
    packageDocumentsRepository.findAllByDocumentId.mockResolvedValue([])

    await expect(
      useCase.execute({
        documentId: 'doc-1',
        userId: 'user-1',
        collaboratorId: 'collab-1',
        collaboratorProfile: CollaboratorProfile.Lawyer,
        newClassification: 'CLIENTE',
      }),
    ).rejects.toThrow('Documento não está vinculado a um pacote.')
  })

  it('raises an error when the document package is not found', async () => {
    documentsRepository.findById.mockResolvedValue({
      classificacaoAcesso: 'INTERNO',
    } as any)
    packageDocumentsRepository.findAllByDocumentId.mockResolvedValue([
      {
        documentPackageId: 'pkg-1',
      } as any,
    ])
    documentPackagesRepository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({
        documentId: 'doc-1',
        userId: 'user-1',
        collaboratorId: 'collab-1',
        collaboratorProfile: CollaboratorProfile.Lawyer,
        newClassification: 'CLIENTE',
      }),
    ).rejects.toThrow('Pacote de documentos não encontrado.')
  })

  it('denies access if package is formalization', async () => {
    documentsRepository.findById.mockResolvedValue({
      classificacaoAcesso: 'INTERNO',
    } as any)
    packageDocumentsRepository.findAllByDocumentId.mockResolvedValue([
      {
        documentPackageId: 'pkg-1',
      } as any,
    ])
    documentPackagesRepository.findById.mockResolvedValue({
      context: { type: 'formalization' },
    } as any)

    await expect(
      useCase.execute({
        documentId: 'doc-1',
        userId: 'user-1',
        collaboratorId: 'collab-1',
        collaboratorProfile: CollaboratorProfile.Lawyer,
        newClassification: 'CLIENTE',
      }),
    ).rejects.toThrow('Acesso a documentos de formalização ainda não foi implementado.')
  })

  it('denies access if lawyer is not assigned and is not admin', async () => {
    documentsRepository.findById.mockResolvedValue({
      classificacaoAcesso: 'INTERNO',
    } as any)
    packageDocumentsRepository.findAllByDocumentId.mockResolvedValue([
      {
        documentPackageId: 'pkg-1',
      } as any,
    ])
    documentPackagesRepository.findById.mockResolvedValue({
      context: { type: 'consultation', consultationId: 'cons-1' },
    } as any)
    consultationsRepository.findById.mockResolvedValue({
      assignedLawyerId: 'collab-2',
    } as any)

    await expect(
      useCase.execute({
        documentId: 'doc-1',
        userId: 'user-1',
        collaboratorId: 'collab-1', // Not matching collab-2
        collaboratorProfile: CollaboratorProfile.Lawyer,
        newClassification: 'CLIENTE',
      }),
    ).rejects.toThrow(
      'Acesso negado: apenas o advogado responsável ou um administrador pode alterar a classificação de acesso deste documento.',
    )
  })

  it('grants access if lawyer is the assigned one', async () => {
    documentsRepository.findById.mockResolvedValue({
      classificacaoAcesso: 'INTERNO',
    } as any)
    packageDocumentsRepository.findAllByDocumentId.mockResolvedValue([
      {
        documentPackageId: 'pkg-1',
      } as any,
    ])
    documentPackagesRepository.findById.mockResolvedValue({
      context: { type: 'consultation', consultationId: 'cons-1' },
    } as any)
    consultationsRepository.findById.mockResolvedValue({
      assignedLawyerId: 'collab-1',
    } as any)

    documentsRepository.updateClassificationWithAudit.mockResolvedValue(undefined)

    const response = await useCase.execute({
      documentId: 'doc-1',
      userId: 'user-1',
      collaboratorId: 'collab-1',
      collaboratorProfile: CollaboratorProfile.Lawyer,
      newClassification: 'CLIENTE',
    })

    expect(response.success).toBe(true)
    expect(documentsRepository.updateClassificationWithAudit).toHaveBeenCalledWith({
      documentId: 'doc-1',
      userId: 'user-1',
      valorNovo: 'CLIENTE',
    })
  })

  it('grants access if user is admin, even if not the assigned lawyer', async () => {
    documentsRepository.findById.mockResolvedValue({
      classificacaoAcesso: 'INTERNO',
    } as any)
    packageDocumentsRepository.findAllByDocumentId.mockResolvedValue([
      {
        documentPackageId: 'pkg-1',
      } as any,
    ])
    documentPackagesRepository.findById.mockResolvedValue({
      context: { type: 'consultation', consultationId: 'cons-1' },
    } as any)
    consultationsRepository.findById.mockResolvedValue({
      assignedLawyerId: 'collab-2',
    } as any)

    documentsRepository.updateClassificationWithAudit.mockResolvedValue(undefined)

    const response = await useCase.execute({
      documentId: 'doc-1',
      userId: 'user-1',
      collaboratorId: 'collab-admin',
      collaboratorProfile: CollaboratorProfile.Admin, // Admin Profile
      newClassification: 'CLIENTE',
    })

    expect(response.success).toBe(true)
    expect(documentsRepository.updateClassificationWithAudit).toHaveBeenCalledWith({
      documentId: 'doc-1',
      userId: 'user-1',
      valorNovo: 'CLIENTE',
    })
  })
})
