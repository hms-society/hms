import type { DynamicFormEditorOverlaysProps } from './types'

export function useDynamicFormEditorOverlays({ editor }: DynamicFormEditorOverlaysProps) {
  const { draft, overlay } = editor
  const fieldDialog = overlay.kind === 'field' ? overlay : null
  const editingField =
    fieldDialog?.fieldIndex === undefined
      ? undefined
      : draft.fields[fieldDialog.fieldIndex]
  const removingField = overlay.kind === 'remove-field' ? editor.selectedField : null

  function closeOnDismiss(open: boolean) {
    if (!open) editor.closeOverlay()
  }

  function discardChanges() {
    editor.setBypassBlocker(true)
    editor.closeOverlay()
    void editor.navigateTo('dynamicForms')
  }

  return {
    editor,
    draft,
    overlay,
    fieldDialog,
    editingField,
    removingField,
    form: editor.detailQuery.data?.form ?? null,
    closeOnDismiss,
    discardChanges,
    deleteForm: () => void editor.deleteForm(),
  }
}
