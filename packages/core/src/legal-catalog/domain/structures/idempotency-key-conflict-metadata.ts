export type IdempotencyKeyConflictMetadata = {
  operationKey: string
  originalAction: 'duplicated' | 'created' | 'updated'
  originalTargetDynamicFormId: string
}
