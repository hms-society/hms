import { DynamicFormEditorContent } from './dynamic-form-editor-content'
import { DynamicFormEditorStatus } from './dynamic-form-editor-status'
import type { DynamicFormEditorPageProps } from './types'
import { useDynamicFormEditorPage } from './use-dynamic-form-editor-page'

export const DynamicFormEditorPage = (props: DynamicFormEditorPageProps) => {
  const editor = useDynamicFormEditorPage(props)

  return (
    <DynamicFormEditorStatus props={props} editor={editor}>
      <DynamicFormEditorContent props={props} editor={editor} />
    </DynamicFormEditorStatus>
  )
}

export type { DynamicFormEditorPageProps }
