import type { DynamicFormUsageCount } from '../../legal-catalog/domain/structures/dynamic-form-usage-count'

export interface ConsultationDynamicFormUsageProvider {
  countByDynamicFormId(id: string): Promise<DynamicFormUsageCount>
}
