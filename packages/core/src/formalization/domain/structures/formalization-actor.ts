import type { CollaboratorProfile } from '../../../identity/domain/structures'

export type FormalizationActor = {
  readonly actorId: string
  readonly actorProfile?: CollaboratorProfile
}
