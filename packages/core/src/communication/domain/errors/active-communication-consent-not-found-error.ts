import { ConflictError } from '#shared/domain/errors/conflict-error'
import type { CommunicationChannel } from '../structures'

export class ActiveCommunicationConsentNotFoundError extends ConflictError {
  constructor(channel: CommunicationChannel) {
    super(`O cliente não possui consentimento ativo para o canal ${channel}.`)
  }
}
