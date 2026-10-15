import { ConsultationStatus } from '../../domain/structures'
import { UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import {
  DocumentFaker,
  DocumentVersionFaker,
  DocumentPackageFaker,
  PackageDocumentFaker,
} from '../../../document-production/domain/entities/fakers'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { ListConsultationClientDocumentsUseCase } from '../list-consultation-client-documents-use-case'
import type { ResolveConsultationClientDocumentUseCase } from '../resolve-consultation-client-document-use-case'
import type { ConsultationsRepository } from '../../interfaces'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import type {
  DocumentPackagesRepository,
  PackageDocumentsRepository,
  DocumentsRepository,
} from '../../../document-production/interfaces'
import { ConsultationFaker } from '../../domain/entities/fakers'
import { CollaboratorFaker, UserFaker } from '#identity/domain/entities/fakers'
describe('List Consulta client documents', () => {
  it('filters pending and foreign assigned stages independently of Formalização', async () => {
    const consultations = mock<ConsultationsRepository>()
    const packages = mock<DocumentPackagesRepository>()
    const inclusions = mock<PackageDocumentsRepository>()
    const documents = mock<DocumentsRepository>()
    const collaborators = mock<CollaboratorsRepository>()
    const users = mock<UsersRepository>()
    const resolve = mock<ResolveConsultationClientDocumentUseCase>()
    const actor = CollaboratorFaker.legal()
    collaborators.findById.mockResolvedValue(actor)
    users.findById.mockResolvedValue(
      UserFaker.fake({ id: actor.userId, status: 'active' }),
    )
    consultations.findByClientId.mockResolvedValue([
      ConsultationFaker.fake({ assignedLawyerId: actor.id }),
      ConsultationFaker.fake({
        assignedLawyerId: 'other',
        status: 'completed',
        completedAt: new Date(),
      }),
    ])
    expect(
      await new ListConsultationClientDocumentsUseCase(
        consultations,
        packages,
        inclusions,
        documents,
        collaborators,
        users,
        resolve,
      ).execute({ clientId: 'client', actorId: actor.id }),
    ).toEqual([])
    expect(packages.findByContext).not.toHaveBeenCalled()
    expect(resolve.execute).not.toHaveBeenCalled()
  })
  it('returns no content for an Admin operational account', async () => {
    const collaborators = mock<CollaboratorsRepository>()
    collaborators.findById.mockResolvedValue(CollaboratorFaker.administrative())
    const consultations = mock<ConsultationsRepository>()
    expect(
      await new ListConsultationClientDocumentsUseCase(
        consultations,
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentsRepository>(),
        collaborators,
        mock<UsersRepository>(),
        mock<ResolveConsultationClientDocumentUseCase>(),
      ).execute({ clientId: 'client', actorId: 'actor' }),
    ).toEqual([])
    expect(consultations.findByClientId).not.toHaveBeenCalled()
  })
  describe('completed readable stage documents', () => {
    const actor = CollaboratorFaker.legal()
    const completed = ConsultationFaker.fake({
      assignedLawyerId: actor.id,
      status: ConsultationStatus.Completed,
      completedAt: new Date(),
    })
    const document = DocumentFaker.fake({ currentVersionId: 'version-1' })
    const version = DocumentVersionFaker.fake({
      id: 'version-1',
      documentId: document.id,
    })
    const documentPackage = DocumentPackageFaker.fake()
    const inclusion = PackageDocumentFaker.fake({
      documentPackageId: documentPackage.id,
      documentId: document.id,
    })
    const source = {
      consultationId: completed.id,
      clientId: completed.clientId,
      documentId: document.id,
      versionId: version.id,
      name: document.title,
      fileId: version.fileId,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      createdAt: version.createdAt,
    }
    let consultations: MockProxy<ConsultationsRepository>
    let packages: MockProxy<DocumentPackagesRepository>
    let inclusions: MockProxy<PackageDocumentsRepository>
    let documents: MockProxy<DocumentsRepository>
    let collaborators: MockProxy<CollaboratorsRepository>
    let users: MockProxy<UsersRepository>
    let resolve: MockProxy<ResolveConsultationClientDocumentUseCase>
    let useCase: ListConsultationClientDocumentsUseCase
    const request = { clientId: completed.clientId, actorId: actor.id }
    beforeEach(() => {
      consultations = mock<ConsultationsRepository>()
      packages = mock<DocumentPackagesRepository>()
      inclusions = mock<PackageDocumentsRepository>()
      documents = mock<DocumentsRepository>()
      collaborators = mock<CollaboratorsRepository>()
      users = mock<UsersRepository>()
      resolve = mock<ResolveConsultationClientDocumentUseCase>()
      consultations.findByClientId.mockResolvedValue([completed])
      packages.findByContext.mockResolvedValue(documentPackage)
      inclusions.findByDocumentPackageId.mockResolvedValue([inclusion])
      documents.findById.mockResolvedValue(document)
      collaborators.findById.mockResolvedValue(actor)
      users.findById.mockResolvedValue(
        UserFaker.fake({ id: actor.userId, status: UserStatus.Active }),
      )
      resolve.execute.mockResolvedValue(source)
      useCase = new ListConsultationClientDocumentsUseCase(
        consultations,
        packages,
        inclusions,
        documents,
        collaborators,
        users,
        resolve,
      )
    })
    it('releases the current exact version only after the owner rechecks source authorization', async () => {
      expect(await useCase.execute(request)).toEqual([source])
      expect(resolve.execute).toHaveBeenCalledWith({
        ...request,
        consultationId: completed.id,
        documentId: document.id,
        versionId: version.id,
        forSelection: true,
      })
    })
    it('excludes incomplete completion metadata instead of making an approved document available early', async () => {
      consultations.findByClientId.mockResolvedValue([
        ConsultationFaker.fake({ clientId: completed.clientId, assignedLawyerId: actor.id, status: ConsultationStatus.Completed, completedAt: undefined }),
      ])
      expect(await useCase.execute(request)).toEqual([])
      expect(packages.findByContext).not.toHaveBeenCalled()
    })
    it('returns no documents when the current lawyer account is disabled', async () => {
      users.findById.mockResolvedValue(
        UserFaker.fake({ id: actor.userId, status: UserStatus.Disabled }),
      )
      expect(await useCase.execute(request)).toEqual([])
      expect(consultations.findByClientId).not.toHaveBeenCalled()
    })
    it('does not invent a package or document when source structure is unavailable', async () => {
      packages.findByContext.mockResolvedValue(undefined)
      expect(await useCase.execute(request)).toEqual([])
      expect(inclusions.findByDocumentPackageId).not.toHaveBeenCalled()
    })
    it.each([
      undefined,
      DocumentFaker.fake({ id: document.id, currentVersionId: undefined }),
    ])('excludes missing current documents or versions', async (missing) => {
      documents.findById.mockResolvedValue(missing)
      expect(await useCase.execute(request)).toEqual([])
      expect(resolve.execute).not.toHaveBeenCalled()
    })
    it.each([
      new ForbiddenError('Permission revoked'),
      new NotFoundError('Approval revoked'),
    ])('filters source eligibility lost during reconciliation', async (error) => {
      resolve.execute.mockRejectedValue(error)
      expect(await useCase.execute(request)).toEqual([])
    })
    it('propagates operational failures rather than treating them as permission filtering', async () => {
      resolve.execute.mockRejectedValue(new Error('source database unavailable'))
      await expect(useCase.execute(request)).rejects.toThrow(
        'source database unavailable',
      )
    })
  })
})
