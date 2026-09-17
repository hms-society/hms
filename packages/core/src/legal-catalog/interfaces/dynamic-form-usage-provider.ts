import type { DynamicFormUsageImpact } from '../domain/structures/dynamic-form-usage-impact'

export interface DynamicFormUsageProvider {
  getImpact(dynamicFormId: string): Promise<DynamicFormUsageImpact>
  getFieldImpact(dynamicFormId: string, fieldId: string): Promise<DynamicFormUsageImpact>
}
