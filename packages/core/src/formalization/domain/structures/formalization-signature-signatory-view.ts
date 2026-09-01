import type { CommunicationChannel } from '../../../communication/domain/structures'
import type { CollaboratorProfile } from '../../../identity/domain/structures'
import type { FormalizationSignatoryRole } from './formalization-signatory-role'

type EligibleCollaboratorProfile = Extract<
  CollaboratorProfile,
  'lawyer' | 'paralegal' | 'supervisor'
>

export type FormalizationSignatureSignatoryView = {
  readonly signatoryId: string
  readonly personId: string
  readonly role: FormalizationSignatoryRole
  readonly name: string
  readonly profile?: EligibleCollaboratorProfile
  readonly removable: boolean
  readonly availableChannels: ReadonlyArray<CommunicationChannel>
  readonly selectedChannels: readonly CommunicationChannel[]
  readonly documentIds: ReadonlyArray<string>
}
