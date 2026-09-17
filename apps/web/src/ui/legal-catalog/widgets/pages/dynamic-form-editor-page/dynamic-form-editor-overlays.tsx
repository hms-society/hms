import { DynamicFormDeleteDialog } from './dynamic-form-delete-dialog'
import { DynamicFormFieldDialog } from './dynamic-form-field-dialog'
import { DynamicFormFieldRemovalDialog } from './dynamic-form-field-removal-dialog'
import { DynamicFormStaleVersionDialog } from './dynamic-form-stale-version-dialog'
import { DynamicFormUnsavedChangesDialog } from './dynamic-form-unsaved-changes-dialog'
import type { DynamicFormEditorPageController } from './use-dynamic-form-editor-page'

export function DynamicFormEditorOverlays({
  controller,
}: {
  controller: DynamicFormEditorPageController
}) {
  const { draft, overlay } = controller
  const fieldDialog = overlay.kind === 'field' ? overlay : null
  const editingField =
    fieldDialog?.fieldIndex === undefined
      ? undefined
      : draft.fields[fieldDialog.fieldIndex]
  const removingField = overlay.kind === 'remove-field' ? controller.selectedField : null
  const form = controller.detailQuery.data?.form ?? null

  return (
    <>
      <DynamicFormFieldDialog
        open={Boolean(fieldDialog)}
        mode={fieldDialog?.mode ?? 'create'}
        stage={draft.stage}
        legalAreaName={controller.areaName}
        legalTopicNames={controller.topicNames}
        initialValue={editingField}
        onOpenChange={(open) => !open && controller.closeOverlay()}
        onSubmit={controller.saveField}
      />
      <DynamicFormFieldRemovalDialog
        open={Boolean(removingField)}
        dynamicFormId={
          controller.props.mode === 'edit' ? controller.props.dynamicFormId : undefined
        }
        field={removingField}
        onOpenChange={(open) => !open && controller.closeOverlay()}
        onConfirm={controller.removeField}
      />
      <DynamicFormUnsavedChangesDialog
        open={overlay.kind === 'unsaved-navigation'}
        onContinueEditing={controller.closeOverlay}
        onDiscardChanges={() => {
          controller.setBypassBlocker(true)
          controller.closeOverlay()
          void controller.navigateTo('dynamicForms')
        }}
      />
      <DynamicFormStaleVersionDialog
        open={overlay.kind === 'stale-version'}
        expectedVersion={
          overlay.kind === 'stale-version' ? overlay.expectedVersion : controller.version
        }
        currentVersion={
          overlay.kind === 'stale-version' ? overlay.currentVersion : controller.version
        }
        isReloading={controller.detailQuery.isFetching}
        errorMessage={controller.saveError}
        onContinueEditing={controller.closeOverlay}
        onReloadServerVersion={controller.reloadServerVersion}
      />
      <DynamicFormDeleteDialog
        open={overlay.kind === 'delete-form'}
        form={form}
        isDirty={controller.isDirty}
        isDeleting={controller.deletePending}
        errorMessage={controller.deleteError}
        onOpenChange={(open) => !open && controller.closeOverlay()}
        onDeleted={() => void controller.deleteForm()}
      />
    </>
  )
}
