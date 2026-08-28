import type { CommunicationChannel } from '../../../communication/domain/structures'
import type { CollaboratorProfile } from '../../../identity/domain/structures'

export type FormalizationSignatureSourcePerson = {
  readonly personId: string
  readonly name: string
  readonly type?: 'natural' | 'legal'
  readonly profile?: CollaboratorProfile
  readonly email?: string
  readonly phone?: string
  readonly availableChannels: ReadonlyArray<CommunicationChannel>
}
