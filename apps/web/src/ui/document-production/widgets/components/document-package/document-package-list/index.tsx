import { TableSurface } from '@/ui/shared/widgets/components/table-surface'
import { DocumentPackageRow } from '../document-package-row'
import { useDocumentPackageList } from './use-document-package-list'
import type { DocumentPackageListProps } from './use-document-package-list'

export type { DocumentPackageListProps } from './use-document-package-list'
export type { DocumentPackageAction, DocumentPackageItem } from '../types'

export const DocumentPackageList = (props: DocumentPackageListProps) => {
  const { items, ...rowProps } = useDocumentPackageList(props)

  return (
    <TableSurface ariaLabel='Pacote de documentos' className='border-0 p-0 shadow-none'>
      <ul className='divide-y divide-border'>
        {items.map((item) => (
          <DocumentPackageRow key={item.id} item={item} {...rowProps} />
        ))}
      </ul>
    </TableSurface>
  )
}
