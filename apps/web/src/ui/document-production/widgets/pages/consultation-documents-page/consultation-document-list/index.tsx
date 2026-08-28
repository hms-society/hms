import { TableSurface } from '@/ui/shared/widgets/components/table-surface'
import { ConsultationDocumentRow } from '../consultation-document-row'
import type { ConsultationDocumentViewModel } from '../use-consultation-documents-page'

export type ConsultationDocumentListProps = {
  items: readonly ConsultationDocumentViewModel[]
  onGenerateDocument: (documentId: string) => Promise<unknown>
  onCancelDocumentGeneration: (documentId: string) => Promise<unknown>
  isCancellingDocument: boolean
  onRefreshDocument: () => Promise<unknown>
  isReadOnly: boolean
  onUpdateAccess: (
    documentId: string,
    classification: string,
    partnerId?: string,
  ) => Promise<void>
}

export const ConsultationDocumentList = ({
  items,
  onGenerateDocument,
  onCancelDocumentGeneration,
  isCancellingDocument,
  onRefreshDocument,
  isReadOnly,
  onUpdateAccess,
}: ConsultationDocumentListProps) => (
  <TableSurface ariaLabel='Documentos da consulta' className='border-0 p-0 shadow-none'>
    <ul className='divide-y divide-border'>
      {items.map((item) => (
        <ConsultationDocumentRow
          key={item.document.id}
          item={item}
          onGenerateDocument={onGenerateDocument}
          onCancelDocumentGeneration={onCancelDocumentGeneration}
          isCancellingDocument={isCancellingDocument}
          onRefreshDocument={onRefreshDocument}
          isReadOnly={isReadOnly}
          onUpdateAccess={onUpdateAccess}
        />
      ))}
    </ul>
  </TableSurface>
)
