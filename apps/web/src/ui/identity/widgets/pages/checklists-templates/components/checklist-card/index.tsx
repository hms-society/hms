import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'
import { ChecklistSearch } from './checklist-search'
import { AddDocumentButton } from './add-document-button'
import { DocumentsTable } from './documents-table'
import { ChecklistFooter } from './checklist-footer'
import { AddDocumentDialog } from '../add-document-dialog'
import type { ChecklistDocument, DocumentFileType } from '../../types'

type ChecklistCardProps = {
  areaName: string
  documents: ChecklistDocument[]
  search: string
  onSearchChange: (value: string) => void
  onToggleRequired: (id: string) => void
  onChangeType: (id: string, type: DocumentFileType) => void
  onDelete: (id: string) => void
  onAddDocument: (
    name: string,
    types: readonly DocumentFileType[],
    required: boolean,
  ) => void
}

export function ChecklistCard({
  areaName,
  documents,
  search,
  onSearchChange,
  onToggleRequired,
  onChangeType,
  onDelete,
  onAddDocument,
}: ChecklistCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <section className='overflow-hidden rounded-2xl border border-border bg-card shadow-sm'>
        <div className='flex flex-col gap-4 p-6'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
            <h2 className='font-serif text-[21px] font-semibold text-primary'>
              {areaName} - Checklist de Documentos
            </h2>

            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <ChecklistSearch value={search} onChange={onSearchChange} />

              <AddDocumentButton onClick={() => setDialogOpen(true)} />
            </div>
          </div>

          <p className='text-[13px] text-muted-foreground'>
            Marque como obrigatório de mérito ou opcional por caso.
          </p>
        </div>

        <DocumentsTable
          documents={documents}
          onToggleRequired={onToggleRequired}
          onChangeType={onChangeType}
          onDelete={onDelete}
        />

        {documents.length === 0 && (
          <div className='flex flex-col items-center justify-center gap-3 px-6 py-12 text-center'>
            <div className='flex size-10 items-center justify-center rounded-full bg-muted'>
              <Plus className='size-5 text-muted-foreground' />
            </div>

            <p className='text-sm font-medium text-foreground'>
              Nenhum documento encontrado
            </p>

            <p className='text-xs text-muted-foreground'>
              Tente alterar sua busca ou adicione um novo documento.
            </p>

            <Button type='button' variant='outline' onClick={() => setDialogOpen(true)}>
              Adicionar Documento
            </Button>
          </div>
        )}

        <ChecklistFooter />
      </section>

      <AddDocumentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={onAddDocument}
      />
    </>
  )
}
