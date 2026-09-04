import type { UseCase } from '../../shared/interfaces'
import { SignatureCsrfInvalidError, SignatureSessionInvalidError } from '../domain/errors'
import type { FormalizationSignatureGatewaySessionsRepository } from '../interfaces'

type Request = {
  readonly sessionToken: string
  readonly deviceToken: string
  readonly csrfToken: string
}
type Response = void
type Dependencies = {
  readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository
  readonly hash: (value: string) => string
}

export class CloseSignatureResultUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  async execute(request: Request): Promise<void> {
    const session = await this.dependencies.sessionsRepository.findByTokenHash(
      this.dependencies.hash(request.sessionToken),
    )
    if (
      session?.kind !== 'result' ||
      session.status !== 'active' ||
      session.deviceSecretHash !== this.dependencies.hash(request.deviceToken)
    )
      throw new SignatureSessionInvalidError()
    if (session.csrfHash !== this.dependencies.hash(request.csrfToken))
      throw new SignatureCsrfInvalidError()
    const replaced = await this.dependencies.sessionsRepository.replace({
      sessionId: session.id,
      expectedVersion: session.version,
      changes: {
        status: 'revoked',
        revokedAt: new Date(),
        revocationReason: 'closed',
      },
    })
    if (!replaced) throw new SignatureSessionInvalidError()
  }
}
