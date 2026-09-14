import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'

export type DynamicFormsTableProps = {
  items: DynamicFormListItem[]
  page: number
  pageSize: number
  pageCount: number
  total: number
  isPending: boolean
  onEdit: (dynamicFormId: string) => void
  onDuplicate: (form: DynamicFormListItem) => void
  onChangeAvailability: (form: DynamicFormListItem) => void
  onDelete: (form: DynamicFormListItem) => void
  onPageChange: (page: number) => void
}
