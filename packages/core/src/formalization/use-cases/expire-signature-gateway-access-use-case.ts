import type { UseCase } from '../../shared/interfaces'

type Request = { readonly occurredAt: Date; readonly limit: number }
type Response = {
  readonly invitations: number
  readonly challenges: number
  readonly sessions: number
  readonly bindings: number
}
type Dependencies = {
  readonly expire: (input: Request) => Promise<Response>
}

export class ExpireSignatureGatewayAccessUseCase implements UseCase<Request, Response> {
  constructor(private readonly dependencies: Dependencies) {}

  execute(request: Request): Promise<Response> {
    return this.dependencies.expire(request)
  }
}
