import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'
import { Switch } from '@/ui/shadcn/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
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
        <span className='text-[14px] text-foreground'>
          {document.name}
        </span>
      </td>

      <td className='w-[120px] px-3 py-3'>
        <Select
          value={document.type}
          onValueChange={(value) =>
            onChangeType(document.id, value as DocumentFileType)
          }
        >
          <SelectTrigger className='h-9 w-[108px] text-[13px]'>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value='PDF'>PDF</SelectItem>
            <SelectItem value='ANY'>Qualquer</SelectItem>
          </SelectContent>
        </Select>
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
