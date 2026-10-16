import { beforeEach, describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { ResolveFormalizationClientDocumentUseCase } from '../resolve-formalization-client-document-use-case'
import type {
  FormalizationsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureArtifactsRepository,
} from '../../interfaces'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import type { DocumentsRepository } from '../../../document-production/interfaces'
import {
  fakeFormalization,
  fakeFormalizationSignatureRequest,
  fakeFormalizationSignatureRequestDocument,
  fakeFormalizationSignatureArtifact,
} from '../../domain/entities/fakers'
import { CollaboratorFaker, UserFaker } from '#identity/domain/entities/fakers'
import { DocumentFaker } from '../../../document-production/domain/entities/fakers'
describe('Resolve Formalização client document', () => {
  const formalizations = mock<FormalizationsRepository>()
  const requests = mock<FormalizationSignatureRequestsRepository>()
  const requestDocuments = mock<FormalizationSignatureRequestDocumentsRepository>()
  const artifacts = mock<FormalizationSignatureArtifactsRepository>()
  const documents = mock<DocumentsRepository>()
  const collaborators = mock<CollaboratorsRepository>()
  const users = mock<UsersRepository>()
  const actor = CollaboratorFaker.legal()
  const user = UserFaker.fake({ id: actor.userId, status: 'active' })
  const formalization = fakeFormalization({
    assignedLawyerId: actor.id,
    status: 'completed',
    completedAt: new Date(),
  })
  const document = DocumentFaker.fake()
  const signature = fakeFormalizationSignatureRequest({
    formalizationId: formalization.id,
    status: 'confirmed',
  })
  const requestDocument = fakeFormalizationSignatureRequestDocument({
    requestId: signature.id,
    sourceDocumentId: document.id,
    status: 'confirmed',
    confirmedAt: new Date(),
  })
  const artifact = fakeFormalizationSignatureArtifact({
    requestId: signature.id,
    requestDocumentId: requestDocument.id,
  })
  const request = {
    clientId: formalization.clientId,
    actorId: actor.id,
    formalizationId: formalization.id,
    requestDocumentId: requestDocument.id,
    artifactId: artifact.id,
    forSelection: true,
  }
  const useCase = new ResolveFormalizationClientDocumentUseCase(
    formalizations,
    requests,
    requestDocuments,
    artifacts,
    documents,
    collaborators,
    users,
  )
  beforeEach(() => {
    formalizations.findById.mockResolvedValue({
      ...formalization,
      signatureRequestId: signature.id,
    })
    collaborators.findById.mockResolvedValue(actor)
    users.findById.mockResolvedValue(user)
    requests.findById.mockResolvedValue(signature)
    requestDocuments.findById.mockResolvedValue(requestDocument)
    artifacts.findById.mockResolvedValue(artifact)
    documents.findById.mockResolvedValue(document)
  })
  it('releases only a completed stage preserved final PDF', async () => {
    expect(await useCase.execute(request)).toMatchObject({
      artifactId: artifact.id,
      privateFileId: artifact.privateFileId,
      mimeType: 'application/pdf',
    })
  })
  it('blocks a signed artifact before successful stage completion', async () => {
    formalizations.findById.mockResolvedValue({
      ...formalization,
      status: 'in_progress',
      completedAt: undefined,
      signatureRequestId: signature.id,
    })
    await expect(useCase.execute(request)).rejects.toThrow()
  })
  it('blocks a partial signature request', async () => {
    requests.findById.mockResolvedValue({ ...signature, status: 'submitted' })
    await expect(useCase.execute(request)).rejects.toThrow()
  })
  it('blocks non-PDF evidence', async () => {
    artifacts.findById.mockResolvedValue({ ...artifact, kind: 'provider_evidence' })
    await expect(useCase.execute(request)).rejects.toThrow()
  })
  it('blocks foreign artifact linkage', async () => {
    artifacts.findById.mockResolvedValue({ ...artifact, requestDocumentId: 'foreign' })
    await expect(useCase.execute(request)).rejects.toThrow()
  })
  it('preserves exact historical read after current request changes', async () => {
    formalizations.findById.mockResolvedValue({
      ...formalization,
      signatureRequestId: 'new-request',
    })
    await expect(useCase.execute(request)).rejects.toThrow()
    expect((await useCase.execute({ ...request, forSelection: false })).artifactId).toBe(
      artifact.id,
    )
  })
  it('allows an active Admin to resolve a completed source for checklist selection', async () => {
    const admin = CollaboratorFaker.administrative()
    collaborators.findById.mockResolvedValue(admin)
    users.findById.mockResolvedValue(UserFaker.fake({ id: admin.userId, status: 'active' }))
    formalizations.findById.mockResolvedValue({
      ...formalization,
      assignedLawyerId: 'another-lawyer',
      signatureRequestId: signature.id,
    })

    await expect(useCase.execute({ ...request, actorId: admin.id })).resolves.toMatchObject({
      formalizationId: formalization.id,
      clientId: formalization.clientId,
      artifactId: artifact.id,
      privateFileId: artifact.privateFileId,
    })
  })
  it('denies an inactive Admin access to a completed source', async () => {
    const admin = CollaboratorFaker.administrative()
    collaborators.findById.mockResolvedValue(admin)
    users.findById.mockResolvedValue(UserFaker.fake({ id: admin.userId, status: 'disabled' }))
    formalizations.findById.mockResolvedValue({
      ...formalization,
      assignedLawyerId: 'another-lawyer',
      signatureRequestId: signature.id,
    })

    await expect(useCase.execute({ ...request, actorId: admin.id })).rejects.toThrow()
  })
})
