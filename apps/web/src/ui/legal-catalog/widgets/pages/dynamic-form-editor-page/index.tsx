import { DynamicFormEditorContent } from './dynamic-form-editor-content'
import {
  DynamicFormEditorStatus,
  getDynamicFormEditorStatus,
} from './dynamic-form-editor-status'
import type { DynamicFormEditorPageProps } from './types'
import { useDynamicFormEditorPage } from './use-dynamic-form-editor-page'

export function DynamicFormEditorPage(props: DynamicFormEditorPageProps) {
  const controller = useDynamicFormEditorPage(props)
  const status = getDynamicFormEditorStatus(props, controller)

  if (status)
    return (
      <DynamicFormEditorStatus
        status={status}
        onRetry={() => void controller.detailQuery.refetch()}
      />
    )

  return <DynamicFormEditorContent props={props} controller={controller} />
}

export type { DynamicFormEditorPageProps }
