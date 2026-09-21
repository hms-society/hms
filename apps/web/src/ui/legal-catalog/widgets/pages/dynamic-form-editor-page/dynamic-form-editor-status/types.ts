import type { ReactNode } from 'react'
import type { DynamicFormEditorPageProps } from '../types'
import type { DynamicFormEditorPageController } from '../use-dynamic-form-editor-page'

export type DynamicFormEditorStatusKind = 'invalid-id' | 'loading' | 'not-found' | 'error'

export type DynamicFormEditorStatusProps = {
  props: DynamicFormEditorPageProps
  editor: DynamicFormEditorPageController
  children: ReactNode
}
