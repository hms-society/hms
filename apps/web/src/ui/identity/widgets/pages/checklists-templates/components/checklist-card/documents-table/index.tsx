import type { ChecklistDocument, DocumentFileType } from '../../../types'
import { DocumentRow } from './document-row'

type DocumentsTableProps = {
  documents: ChecklistDocument[]
  onToggleRequired: (id: string) => void
  onChangeType: (id: string, type: DocumentFileType) => void
  onDelete: (id: string) => void
}

export function DocumentsTable({
  documents,
  onToggleRequired,
  onChangeType,
  onDelete,
}: DocumentsTableProps) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[760px] border-collapse'>
        <thead>
          <tr className='bg-muted/40 text-left'>
            <th className='w-[100px] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              Ordem
            </th>

            <th className='px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              Documento
            </th>

            <th className='w-[120px] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              Tipo
            </th>

            <th className='w-[165px] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              Obrigatório
            </th>

            <th className='w-[70px] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {documents.map((document, index) => (
            <DocumentRow
              key={document.id}
              document={document}
              index={index}
              onToggleRequired={onToggleRequired}
              onChangeType={onChangeType}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
