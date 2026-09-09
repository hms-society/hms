import {
  DocumentPackageRow,
  type DocumentPackageRowProps,
} from '../../../components/document-package/document-package-row'
import type { ConsultationDocumentViewModel } from '../use-consultation-documents-page'

export type ConsultationDocumentRowProps = Omit<DocumentPackageRowProps, 'item'> & {
  item: ConsultationDocumentViewModel
}

export const ConsultationDocumentRow = ({
  item,
  ...props
}: ConsultationDocumentRowProps) => <DocumentPackageRow item={item} {...props} />
