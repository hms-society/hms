import type { DynamicFormUsageCount } from '../../legal-catalog/domain/structures/dynamic-form-usage-count'

export interface FormalizationDynamicFormUsageProvider {
  countByDynamicFormId(id: string): Promise<DynamicFormUsageCount>
  countByDynamicFormFieldId(input: {
    dynamicFormId: string
    fieldId: string
  }): Promise<DynamicFormUsageCount>
}
