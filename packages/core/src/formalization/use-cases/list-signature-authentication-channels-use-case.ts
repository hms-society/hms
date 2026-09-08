import type { UseCase } from '../../shared/interfaces'
import type { FormalizationSignatureAuthenticationChannels } from '../domain/structures'
import type { FormalizationSignatureGatewaySessionsRepository, FormalizationSignatureSourceReader, SignatureSecretHasher } from '../interfaces'
import { SignatureSessionInvalidError } from '../domain/errors'
type Request = { readonly flowToken: string; readonly deviceToken: string }
type Response = FormalizationSignatureAuthenticationChannels
type Dependencies = { readonly sessionsRepository: FormalizationSignatureGatewaySessionsRepository; readonly sourceReader: FormalizationSignatureSourceReader; readonly hasher: SignatureSecretHasher }
export class ListSignatureAuthenticationChannelsUseCase implements UseCase<Request, Response> { constructor(private readonly dependencies: Dependencies) {} async execute(request: Request): Promise<Response> { const session = await this.dependencies.sessionsRepository.findByTokenHash(this.dependencies.hasher.hash(request.flowToken)); if (!session || session.kind !== 'flow' || session.status !== 'active' || session.deviceSecretHash !== this.dependencies.hasher.hash(request.deviceToken)) throw new SignatureSessionInvalidError(); return this.dependencies.sourceReader.listConsentedAuthenticationChannels(session.recipientId) } }
