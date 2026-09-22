import type { DynamicFormEditorStatusKind, DynamicFormEditorStatusProps } from './types'

export function getDynamicFormEditorStatus(
  props: DynamicFormEditorStatusProps['props'],
  editor: DynamicFormEditorStatusProps['editor'],
): DynamicFormEditorStatusKind | null {
  if (props.mode === 'edit' && props.isValidId === false) return 'invalid-id'
  if (editor.isLoading) return 'loading'
  if (editor.isNotFound) return 'not-found'
  if (props.mode === 'edit' && editor.detailQuery.isError) return 'error'
  return null
}

export function useDynamicFormEditorStatus({
  props,
  editor,
}: DynamicFormEditorStatusProps) {
  return {
    status: getDynamicFormEditorStatus(props, editor),
    onRetry: () => void editor.detailQuery.refetch(),
  }
}
