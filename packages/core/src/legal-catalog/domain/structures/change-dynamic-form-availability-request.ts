import type { DynamicFormStatus } from './dynamic-form-status'

export type ChangeDynamicFormAvailabilityRequest = {
  dynamicFormId: string
  status: DynamicFormStatus
  actorCollaboratorId: string
}
