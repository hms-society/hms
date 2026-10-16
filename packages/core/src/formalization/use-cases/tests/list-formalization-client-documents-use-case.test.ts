import { FormalizationStatus } from '../../domain/structures'
import { UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { ListFormalizationClientDocumentsUseCase } from '../list-formalization-client-documents-use-case'
import type { ResolveFormalizationClientDocumentUseCase } from '../resolve-formalization-client-document-use-case'
import type {
  FormalizationsRepository,
  FormalizationSignatureArtifactsRepository,
} from '../../interfaces'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import {
  fakeFormalization,
  fakeFormalizationSignatureArtifact,
} from '../../domain/entities/fakers'
import { CollaboratorFaker, UserFaker } from '#identity/domain/entities/fakers'
describe('List Formalização client documents', () => {
  it('filters pending and foreign assigned stages even when Consulta completed separately', async () => {
    const formalizations = mock<FormalizationsRepository>()
    const artifacts = mock<FormalizationSignatureArtifactsRepository>()
    const collaborators = mock<CollaboratorsRepository>()
    const users = mock<UsersRepository>()
    const resolve = mock<ResolveFormalizationClientDocumentUseCase>()
    const actor = CollaboratorFaker.legal()
    collaborators.findById.mockResolvedValue(actor)
    users.findById.mockResolvedValue(
      UserFaker.fake({ id: actor.userId, status: 'active' }),
    )
    formalizations.findByClientId.mockResolvedValue([
      fakeFormalization({ assignedLawyerId: actor.id }),
      fakeFormalization({ assignedLawyerId: 'other', status: 'completed' }),
    ])
    expect(
      await new ListFormalizationClientDocumentsUseCase(
        formalizations,
        artifacts,
        collaborators,
        users,
        resolve,
      ).execute({ clientId: 'client', actorId: actor.id }),
    ).toEqual([])
    expect(artifacts.findByRequestId).not.toHaveBeenCalled()
    expect(resolve.execute).not.toHaveBeenCalled()
  })
  describe('completed signed stage artifacts', () => {
    const actor = CollaboratorFaker.legal()
    const stage = fakeFormalization({
      assignedLawyerId: actor.id,
      status: FormalizationStatus.Completed,
      completedAt: new Date('2026-10-15T12:00:00.000Z'),
      signatureRequestId: 'request-1',
    })
    const artifact = fakeFormalizationSignatureArtifact({
      requestId: 'request-1',
      requestDocumentId: 'request-document-1',
    })
    const source = {
      formalizationId: stage.id,
      clientId: stage.clientId,
      documentId: 'document-1',
      requestDocumentId: 'request-document-1',
      artifactId: artifact.id,
      privateFileId: artifact.privateFileId,
      name: 'Contrato assinado',
      mimeType: artifact.mediaType,
      sizeBytes: artifact.byteCount,
      createdAt: artifact.preservedAt,
    }
    let formalizations: MockProxy<FormalizationsRepository>
    let artifacts: MockProxy<FormalizationSignatureArtifactsRepository>
    let collaborators: MockProxy<CollaboratorsRepository>
    let users: MockProxy<UsersRepository>
    let resolve: MockProxy<ResolveFormalizationClientDocumentUseCase>
    let useCase: ListFormalizationClientDocumentsUseCase
    const request = { clientId: stage.clientId, actorId: actor.id }
    beforeEach(() => {
      formalizations = mock<FormalizationsRepository>()
      artifacts = mock<FormalizationSignatureArtifactsRepository>()
      collaborators = mock<CollaboratorsRepository>()
      users = mock<UsersRepository>()
      resolve = mock<ResolveFormalizationClientDocumentUseCase>()
      formalizations.findByClientId.mockResolvedValue([stage])
      artifacts.findByRequestId.mockResolvedValue([artifact])
      collaborators.findById.mockResolvedValue(actor)
      users.findById.mockResolvedValue(
        UserFaker.fake({ id: actor.userId, status: UserStatus.Active }),
      )
      resolve.execute.mockResolvedValue(source)
      useCase = new ListFormalizationClientDocumentsUseCase(
        formalizations,
        artifacts,
        collaborators,
        users,
        resolve,
      )
    })
    it('returns only the preserved current request artifact after owner authorization', async () => {
      expect(await useCase.execute(request)).toEqual([source])
      expect(resolve.execute).toHaveBeenCalledWith({
        ...request,
        formalizationId: stage.id,
        requestDocumentId: 'request-document-1',
        artifactId: artifact.id,
        forSelection: true,
      })
    })
    it.each([
      { completedAt: undefined },
      { signatureRequestId: undefined },
    ])('excludes stages with incomplete completion evidence', async (changes) => {
      formalizations.findByClientId.mockResolvedValue([
        fakeFormalization({ ...stage, ...changes }),
      ])
      expect(await useCase.execute(request)).toEqual([])
      expect(artifacts.findByRequestId).not.toHaveBeenCalled()
    })
    it('returns completed signed documents to an active Admin across lawyer ownership', async () => {
      const admin = CollaboratorFaker.administrative()
      collaborators.findById.mockResolvedValue(admin)
      users.findById.mockResolvedValue(
        UserFaker.fake({ id: admin.userId, status: UserStatus.Active }),
      )
      formalizations.findByClientId.mockResolvedValue([
        { ...stage, assignedLawyerId: 'another-lawyer' },
      ])

      expect(await useCase.execute({ ...request, actorId: admin.id })).toEqual([source])
      expect(resolve.execute).toHaveBeenCalledWith({
        ...request,
        actorId: admin.id,
        formalizationId: stage.id,
        requestDocumentId: 'request-document-1',
        artifactId: artifact.id,
        forSelection: true,
      })
    })
    it('does not expose completed signed documents to an inactive Admin', async () => {
      const admin = CollaboratorFaker.administrative()
      collaborators.findById.mockResolvedValue(admin)
      users.findById.mockResolvedValue(
        UserFaker.fake({ id: admin.userId, status: UserStatus.Disabled }),
      )

      expect(await useCase.execute({ ...request, actorId: admin.id })).toEqual([])
      expect(formalizations.findByClientId).not.toHaveBeenCalled()
    })
    it('returns no signed content for a disabled assigned lawyer', async () => {
      users.findById.mockResolvedValue(
        UserFaker.fake({ id: actor.userId, status: UserStatus.Disabled }),
      )
      expect(await useCase.execute(request)).toEqual([])
      expect(formalizations.findByClientId).not.toHaveBeenCalled()
    })
    it('excludes provider evidence and unbound artifacts instead of releasing them as signed PDFs', async () => {
      artifacts.findByRequestId.mockResolvedValue([
        fakeFormalizationSignatureArtifact({ kind: 'provider_evidence' }),
        fakeFormalizationSignatureArtifact({ requestDocumentId: undefined }),
      ])
      expect(await useCase.execute(request)).toEqual([])
      expect(resolve.execute).not.toHaveBeenCalled()
    })
    it.each([
      new ForbiddenError('Permission revoked'),
      new NotFoundError('Artifact unavailable'),
    ])('filters sources that became ineligible during owner reconciliation', async (error) => {
      resolve.execute.mockRejectedValue(error)
      expect(await useCase.execute(request)).toEqual([])
    })
    it('propagates operational source failures', async () => {
      resolve.execute.mockRejectedValue(new Error('private metadata unavailable'))
      await expect(useCase.execute(request)).rejects.toThrow(
        'private metadata unavailable',
      )
    })
  })
})
