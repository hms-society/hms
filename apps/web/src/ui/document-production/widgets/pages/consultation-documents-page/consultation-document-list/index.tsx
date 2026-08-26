import {
  DocumentPackageList,
  type DocumentPackageAction,
  type DocumentPackageItem,
} from '../../../components/document-package'
import type { ConsultationDocumentViewModel } from '../use-consultation-documents-page'
import type { ReactNode } from 'react'

export type ConsultationDocumentListProps = {
  items: readonly ConsultationDocumentViewModel[]
  onGenerateDocument: (documentId: string) => Promise<unknown>
  onCancelDocumentGeneration: (documentId: string) => Promise<unknown>
  isCancellingDocument: boolean
  onRefreshDocument: () => Promise<unknown>
  isReadOnly: boolean
  renderAction?: (action: DocumentPackageAction, item: DocumentPackageItem) => ReactNode
}

export const ConsultationDocumentList = ({
  items,
  onGenerateDocument,
  onCancelDocumentGeneration,
  isCancellingDocument,
  onRefreshDocument,
  isReadOnly,
  renderAction,
}: ConsultationDocumentListProps) => (
  <DocumentPackageList
    items={items}
    onGenerateDocument={onGenerateDocument}
    onCancelDocumentGeneration={onCancelDocumentGeneration}
    isCancellingDocument={isCancellingDocument}
    onRefreshDocument={onRefreshDocument}
    isReadOnly={isReadOnly}
    renderAction={renderAction}
  />
)
