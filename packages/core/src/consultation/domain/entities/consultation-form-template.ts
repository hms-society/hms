import type { ConsultationFormTemplateStatus } from '../structures'

import type { ConsultationFormField } from './consultation-form-field'

export type ConsultationFormTemplate = {
  id: string
  name: string
  description?: string
  legalAreaId: string
  legalTopicIds: [string, ...string[]]
  status: ConsultationFormTemplateStatus
  fields: ConsultationFormField[]
  createdAt: Date
  updatedAt: Date
}
