import type { DocumentPackageItem } from '../types'
import type { DocumentPackageRowProps } from '../document-package-row'

export type DocumentPackageListProps = Omit<DocumentPackageRowProps, 'item'> & {
  items: readonly DocumentPackageItem[]
}

export function useDocumentPackageList(props: DocumentPackageListProps) {
  return props
}
