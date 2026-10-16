import { FormalizationStatus } from '../domain/structures'
import { CollaboratorProfile, UserStatus } from '#identity/domain/structures'
import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { NotFoundError } from '#shared/domain/errors/not-found-error'
import type {
  FormalizationsRepository,
  FormalizationSignatureArtifactsRepository,
} from '../interfaces'
import type { CollaboratorsRepository, UsersRepository } from '#identity/interfaces'
import type { ResolveFormalizationClientDocumentUseCase } from './resolve-formalization-client-document-use-case'
import type { FormalizationClientDocument } from '../domain/structures/formalization-client-document'
export class ListFormalizationClientDocumentsUseCase {
  constructor(
    private readonly formalizations: FormalizationsRepository,
    private readonly artifacts: FormalizationSignatureArtifactsRepository,
    private readonly collaborators: CollaboratorsRepository,
    private readonly users: UsersRepository,
    private readonly resolve: ResolveFormalizationClientDocumentUseCase,
  ) {}
  async execute(request: {
    clientId: string
    actorId: string
  }): Promise<readonly FormalizationClientDocument[]> {
    const actor = await this.collaborators.findById(request.actorId)
    if (
      !actor ||
      (actor.profile !== CollaboratorProfile.Lawyer &&
        actor.profile !== CollaboratorProfile.Admin) ||
      (await this.users.findById(actor.userId))?.status !== UserStatus.Active
    )
      return []
    const canReadAllClientFormalizations = actor.profile === CollaboratorProfile.Admin
    const results: FormalizationClientDocument[] = []
    for (const formalization of await this.formalizations.findByClientId(
      request.clientId,
    )) {
      if (
        !this.isReadableFormalization(
          formalization,
          actor.id,
          canReadAllClientFormalizations,
        )
      )
        continue
      results.push(...(await this.resolveFormalizationDocuments(formalization, request)))
    }
    return results
  }
  private isReadableFormalization(
    formalization: Awaited<ReturnType<FormalizationsRepository['findByClientId']>>[number],
    actorId: string,
    canReadAllClientFormalizations: boolean,
  ) {
    return (
      (canReadAllClientFormalizations || formalization.assignedLawyerId === actorId) &&
      formalization.status === FormalizationStatus.Completed &&
      Boolean(formalization.completedAt && formalization.signatureRequestId)
    )
  }
  private async resolveFormalizationDocuments(
    formalization: Awaited<ReturnType<FormalizationsRepository['findByClientId']>>[number],
    request: { clientId: string; actorId: string },
  ): Promise<FormalizationClientDocument[]> {
    if (!formalization.signatureRequestId) return []
    const documents: FormalizationClientDocument[] = []
    for (const artifact of await this.artifacts.findByRequestId(
      formalization.signatureRequestId,
    )) {
      if (artifact.kind !== 'signed_pdf' || !artifact.requestDocumentId) continue
      const source = await this.resolveReadable({
        ...request,
        formalizationId: formalization.id,
        requestDocumentId: artifact.requestDocumentId,
        artifactId: artifact.id,
        forSelection: true,
      })
      if (source) documents.push(source)
    }
    return documents
  }
  private async resolveReadable(
    request: Parameters<ResolveFormalizationClientDocumentUseCase['execute']>[0],
  ) {
    try {
      return await this.resolve.execute(request)
    } catch (error) {
      if (!(error instanceof ForbiddenError) && !(error instanceof NotFoundError))
        throw error
      return undefined
    }
  }
}
