import { DynamicFormDeleteDialog } from '../dynamic-form-delete-dialog'
import { DynamicFormFieldDialog } from '../dynamic-form-field-dialog'
import { DynamicFormFieldRemovalDialog } from '../dynamic-form-field-removal-dialog'
import { DynamicFormStaleVersionDialog } from '../dynamic-form-stale-version-dialog'
import { DynamicFormUnsavedChangesDialog } from '../dynamic-form-unsaved-changes-dialog'
import type { DynamicFormEditorOverlaysProps } from './types'
import { useDynamicFormEditorOverlays } from './use-dynamic-form-editor-overlays'

export const DynamicFormEditorOverlays = (props: DynamicFormEditorOverlaysProps) => {
  const {
    editor,
    draft,
    overlay,
    fieldDialog,
    editingField,
    removingField,
    form,
    closeOnDismiss,
    discardChanges,
    deleteForm,
  } = useDynamicFormEditorOverlays(props)

  return (
    <>
      <DynamicFormFieldDialog
        open={Boolean(fieldDialog)}
        mode={fieldDialog?.mode ?? 'create'}
        stage={draft.stage}
        legalAreaName={editor.areaName}
        legalTopicNames={editor.topicNames}
        initialValue={editingField}
        onOpenChange={closeOnDismiss}
        onSubmit={editor.saveField}
      />
      <DynamicFormFieldRemovalDialog
        open={Boolean(removingField)}
        dynamicFormId={
          editor.props.mode === 'edit' ? editor.props.dynamicFormId : undefined
        }
        field={removingField}
        onOpenChange={closeOnDismiss}
        onConfirm={editor.removeField}
      />
      <DynamicFormUnsavedChangesDialog
        open={overlay.kind === 'unsaved-navigation'}
        onContinueEditing={editor.closeOverlay}
        onDiscardChanges={discardChanges}
      />
      <DynamicFormStaleVersionDialog
        open={overlay.kind === 'stale-version'}
        expectedVersion={
          overlay.kind === 'stale-version' ? overlay.expectedVersion : editor.version
        }
        currentVersion={
          overlay.kind === 'stale-version' ? overlay.currentVersion : editor.version
        }
        isReloading={editor.detailQuery.isFetching}
        errorMessage={editor.saveError}
        onContinueEditing={editor.closeOverlay}
        onReloadServerVersion={editor.reloadServerVersion}
      />
      <DynamicFormDeleteDialog
        open={overlay.kind === 'delete-form'}
        form={form}
        isDirty={editor.isDirty}
        isDeleting={editor.deletePending}
        errorMessage={editor.deleteError}
        onOpenChange={closeOnDismiss}
        onDeleted={deleteForm}
      />
    </>
  )
}

export type { DynamicFormEditorOverlaysProps } from './types'
