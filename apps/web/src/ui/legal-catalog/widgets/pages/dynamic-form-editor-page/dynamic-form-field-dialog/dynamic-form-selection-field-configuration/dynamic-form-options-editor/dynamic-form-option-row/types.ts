import type {
  DynamicFormEditorOption,
  DynamicFormEditorOptionError,
} from '../../../../types'

export type DynamicFormOptionRowProps = {
  option: DynamicFormEditorOption
  index: number
  count: number
  error?: DynamicFormEditorOptionError
  isDefault: boolean
  isDisabled: boolean
  onLabelChange: (label: string) => void
  onToggleDefault: () => void
  onMove: (targetIndex: number) => void
  onRemove: () => void
}
