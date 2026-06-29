import type { FormTemplate, LegalArea } from '../structures'

export type DemandType = {
  id: string
  name: string
  legalArea: LegalArea
  formTemplate: FormTemplate
  active: boolean
  createdAt: Date
}
