import type { ReactNode } from 'react'

import type { DocumentPackageAction, DocumentPackageItem } from '../types'

export type DocumentPackageRowProps = {
  item: DocumentPackageItem
  onGenerateDocument?: (documentId: string) => Promise<unknown>
  onCancelDocumentGeneration?: (documentId: string) => Promise<unknown>
  isCancellingDocument?: boolean
  onRefreshDocument?: () => Promise<unknown>
  isReadOnly?: boolean
  renderAction?: (action: DocumentPackageAction, item: DocumentPackageItem) => ReactNode
}

export function useDocumentPackageRow(props: DocumentPackageRowProps) {
  return props
}
