import { TableSurface } from '@/ui/shared/widgets/components/table-surface'
import { DocumentPackageRow, type DocumentPackageRowProps } from './document-package-row'
import type { DocumentPackageItem } from './types'

export type DocumentPackageListProps = Omit<DocumentPackageRowProps, 'item'> & {
  items: readonly DocumentPackageItem[]
}

export const DocumentPackageList = ({ items, ...rowProps }: DocumentPackageListProps) => (
  <TableSurface ariaLabel='Pacote de documentos' className='border-0 p-0 shadow-none'>
    <ul className='divide-y divide-border'>
      {items.map((item) => (
        <DocumentPackageRow key={item.id} item={item} {...rowProps} />
      ))}
    </ul>
  </TableSurface>
)
