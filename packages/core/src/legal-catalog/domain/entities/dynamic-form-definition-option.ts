import type { Entity } from '#shared/domain/entities/entity'

export type DynamicFormDefinitionOption = Entity & {
  value: string
  label: string
  position: number
}
