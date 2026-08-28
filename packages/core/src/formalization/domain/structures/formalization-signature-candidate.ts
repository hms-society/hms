import type { CommunicationChannel } from '../../../communication/domain/structures'
import type { CollaboratorProfile } from '../../../identity/domain/structures'

type EligibleCollaboratorProfile = Extract<
  CollaboratorProfile,
  'lawyer' | 'paralegal' | 'supervisor'
>

export type FormalizationSignatureCandidate = {
  readonly collaboratorId: string
  readonly name: string
  readonly profile: EligibleCollaboratorProfile
  readonly email: string
  readonly availableChannels: ReadonlyArray<CommunicationChannel>
}
