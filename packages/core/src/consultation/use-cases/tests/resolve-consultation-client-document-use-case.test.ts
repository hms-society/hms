import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ResolveConsultationClientDocumentUseCase } from '../resolve-consultation-client-document-use-case'
import type { ConsultationsRepository } from '../../interfaces'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import type {
  DocumentPackagesRepository,
  PackageDocumentsRepository,
  DocumentsRepository,
  DocumentVersionsRepository,
} from '../../../document-production/interfaces'
import { ConsultationFaker } from '../../domain/entities/fakers'
import { CollaboratorFaker, UserFaker } from '#identity/domain/entities/fakers'
import {
  DocumentFaker,
  DocumentVersionFaker,
  DocumentPackageFaker,
  PackageDocumentFaker,
} from '../../../document-production/domain/entities/fakers'
describe('Resolve Consulta client document', () => {
  const consultations = mock<ConsultationsRepository>()
  const packages = mock<DocumentPackagesRepository>()
  const inclusions = mock<PackageDocumentsRepository>()
  const documents = mock<DocumentsRepository>()
  const versions = mock<DocumentVersionsRepository>()
  const collaborators = mock<CollaboratorsRepository>()
  const users = mock<UsersRepository>()
  const actor = CollaboratorFaker.legal()
  const user = UserFaker.fake({ id: actor.userId, status: 'active' })
  const consultation = ConsultationFaker.fake({
    assignedLawyerId: actor.id,
    status: 'completed',
    completedAt: new Date(),
  })
  const document = DocumentFaker.fake()
  const version = DocumentVersionFaker.fake({
    documentId: document.id,
    status: 'approved',
  })
  const documentPackage = DocumentPackageFaker.fake()
  const request = {
    clientId: consultation.clientId,
    actorId: actor.id,
    consultationId: consultation.id,
    documentId: document.id,
    versionId: version.id,
    forSelection: true,
  }
  const useCase = new ResolveConsultationClientDocumentUseCase(
    consultations,
    packages,
    inclusions,
    documents,
    versions,
    collaborators,
    users,
  )
  beforeEach(() => {
    consultations.findById.mockResolvedValue(consultation)
    collaborators.findById.mockResolvedValue(actor)
    users.findById.mockResolvedValue(user)
    packages.findByContext.mockResolvedValue(documentPackage)
    inclusions.findByDocumentPackageId.mockResolvedValue([
      PackageDocumentFaker.fake({
        documentId: document.id,
        documentPackageId: documentPackage.id,
      }),
    ])
    documents.findById.mockResolvedValue({ ...document, currentVersionId: version.id })
    versions.findById.mockResolvedValue(version)
  })
  it('releases only the completed current approved version', async () => {
    expect(await useCase.execute(request)).toMatchObject({
      versionId: version.id,
      documentId: document.id,
      consultationId: consultation.id,
    })
  })
  it('does not release approval before stage completion', async () => {
    consultations.findById.mockResolvedValue(
      ConsultationFaker.fake({
        clientId: consultation.clientId,
        assignedLawyerId: actor.id,
      }),
    )
    await expect(useCase.execute(request)).rejects.toThrow()
  })
  it('preserves exact approved historical attachment reads after current-version changes', async () => {
    documents.findById.mockResolvedValue({ ...document, currentVersionId: 'new-version' })
    await expect(useCase.execute(request)).rejects.toThrow()
    expect((await useCase.execute({ ...request, forSelection: false })).versionId).toBe(
      version.id,
    )
  })
  it.each([
    'admin',
    'paralegal',
  ] as const)('denies unassigned operational profile %s', async (profile) => {
    collaborators.findById.mockResolvedValue(
      CollaboratorFaker.fake({ id: actor.id, userId: user.id, profile }),
    )
    await expect(useCase.execute(request)).rejects.toThrow()
  })
  it('denies inactive actor', async () => {
    users.findById.mockResolvedValue({ ...user, status: 'disabled' })
    await expect(useCase.execute(request)).rejects.toThrow()
  })
  it('denies foreign client', async () => {
    await expect(useCase.execute({ ...request, clientId: 'foreign' })).rejects.toThrow()
  })
  it('denies rejected exact version', async () => {
    versions.findById.mockResolvedValue({ ...version, status: 'rejected' })
    await expect(useCase.execute(request)).rejects.toThrow()
  })
})
