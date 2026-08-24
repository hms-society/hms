import type { DocumentGenerationMoment } from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

export type DocumentPackageTemplateItem = Entity & {
  documentTemplateId: string
  generationMoment: DocumentGenerationMoment
  required: boolean
  position: number
}
