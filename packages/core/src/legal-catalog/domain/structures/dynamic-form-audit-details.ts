import type { DynamicFormStatus } from './dynamic-form-status'

export type DynamicFormAuditDetails =
  | {
      action: 'duplicated'
      sourceDynamicFormId: string
      targetDynamicFormId: string
      targetName: string
    }
  | {
      action: 'availability_changed'
      previousStatus: DynamicFormStatus
      targetStatus: DynamicFormStatus
      formName: string
    }
  | {
      action: 'deleted'
      deletedFormName: string
      previousStatus: DynamicFormStatus
    }
  | {
      action: 'created'
      version: 1
      formName: string
      fieldIds: string[]
    }
  | {
      action: 'updated'
      previousVersion: number
      nextVersion: number
      addedFieldIds: string[]
      changedFieldIds: string[]
      removedFieldIds: string[]
      reorderedFieldIds: string[]
    }
