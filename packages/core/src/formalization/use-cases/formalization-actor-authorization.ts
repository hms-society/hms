import { CollaboratorProfile } from '../../identity/domain/structures'
import { FormalizationAccessDeniedError } from '../domain/errors'
import type { FormalizationActor } from '../domain/structures'

export const FormalizationActorAuthorization = {
  isAdmin(actorProfile: FormalizationActor['actorProfile']): boolean {
    return actorProfile === CollaboratorProfile.Admin
  },

  assertAccess(assignedLawyerId: string, actor: FormalizationActor): void {
    if (
      assignedLawyerId !== actor.actorId &&
      !FormalizationActorAuthorization.isAdmin(actor.actorProfile)
    ) {
      throw new FormalizationAccessDeniedError()
    }
  },
} as const
