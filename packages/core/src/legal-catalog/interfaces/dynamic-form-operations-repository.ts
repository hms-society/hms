import type { DynamicFormOperation } from '../domain/structures/dynamic-form-operation'

export interface DynamicFormOperationsRepository {
  findByOperationKey(operationKey: string): Promise<DynamicFormOperation | null>
  addOrGet(operation: DynamicFormOperation): Promise<DynamicFormOperation>
}
