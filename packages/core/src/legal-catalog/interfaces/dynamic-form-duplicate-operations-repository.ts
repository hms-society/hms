import type { DuplicateDynamicFormOperation } from '../domain/structures/duplicate-dynamic-form-operation'

export interface DynamicFormDuplicateOperationsRepository {
  findByOperationKey(operationKey: string): Promise<DuplicateDynamicFormOperation | null>
  /**
   * Atomically inserts the operation or returns the operation already stored
   * for the key. Implementations must not surface a uniqueness error for a
   * concurrent replay.
   */
  addOrGet(operation: DuplicateDynamicFormOperation): Promise<DuplicateDynamicFormOperation>
}
