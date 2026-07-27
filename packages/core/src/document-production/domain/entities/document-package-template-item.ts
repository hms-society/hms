import type { DocumentGenerationMoment } from '../structures'

export type DocumentPackageTemplateItem = {
  id: string
  documentTemplateId: string
  generationMoment: DocumentGenerationMoment
  required: boolean
  position: number
}
