import { GripVertical, Trash2 } from 'lucide-react'
import { ChecklistDocumentType } from '@hms/core/case-management/domain/structures'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Switch } from '@/ui/shadcn/switch'
import type { ChecklistDocument, DocumentFileType } from '../../../../types'

type DocumentRowProps = {
  document: ChecklistDocument
  onToggleRequired: (id: string) => void
  onChangeType: (id: string, type: DocumentFileType) => void
  onDelete: (id: string) => void
  index: number
}

export function DocumentRow({
  document,
  onToggleRequired,
  onChangeType,
  onDelete,
  index,
}: DocumentRowProps) {
  return (
    <tr className='border-b border-border last:border-b-0'>
      <td className='w-[100px] px-3 py-3'>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <GripVertical className='size-4' />

          <span className='text-[13px] font-medium text-foreground'>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
      </td>

      <td className='px-3 py-3'>
        <span className='text-[14px] text-foreground'>{document.name}</span>
      </td>

      <td className='w-[160px] px-3 py-3'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='outline'
              className='h-9 w-[148px] justify-start px-3 text-[13px] font-normal'
            >
              {formatDocumentTypes(document.types)}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align='start' className='w-44'>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={(event) => {
                  event.preventDefault()
                  onChangeType(document.id, option.value)
                }}
                className='gap-2'
              >
                <Checkbox checked={document.types.includes(option.value)} />
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>

      <td className='w-[165px] px-3 py-3'>
        <div className='flex items-center gap-2'>
          <Switch
            checked={document.required}
            onCheckedChange={() => onToggleRequired(document.id)}
          />

          <span
            className={
              document.required
                ? 'text-[13px] text-primary'
                : 'text-[13px] text-muted-foreground'
            }
          >
            {document.required ? 'Obrigatório' : 'Opcional'}
          </span>
        </div>
      </td>

      <td className='w-[70px] px-3 py-3'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='text-red-600 hover:bg-red-50 hover:text-red-700'
          onClick={() => onDelete(document.id)}
          aria-label={`Excluir ${document.name}`}
        >
          <Trash2 className='size-4' />
        </Button>
      </td>
    </tr>
  )
}

const DOCUMENT_TYPE_OPTIONS: readonly {
  value: DocumentFileType
  label: string
}[] = [
  { value: ChecklistDocumentType.Pdf, label: 'PDF' },
  { value: ChecklistDocumentType.Docx, label: 'DOCX' },
  { value: ChecklistDocumentType.Image, label: 'Imagem' },
  { value: ChecklistDocumentType.Any, label: 'Qualquer' },
]

function formatDocumentTypes(types: readonly DocumentFileType[]) {
  if (types.length === 0) {
    return 'Selecione'
  }

  if (types.includes(ChecklistDocumentType.Any)) {
    return 'Qualquer'
  }

  return types.join(', ')
}
