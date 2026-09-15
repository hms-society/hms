import type { DynamicFormListItem } from './dynamic-form-list-item'

export type DynamicFormListResult = {
  items: DynamicFormListItem[]
  page: number
  pageSize: 5
  total: number
  pageCount: number
}
