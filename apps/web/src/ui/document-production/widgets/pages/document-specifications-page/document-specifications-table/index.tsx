import type { DocumentSpecificationListItem } from '@hms/core/document-production/domain/structures'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DocumentSpecificationsApplication } from '../document-specifications-application'

export type DocumentSpecificationsTableProps = {
  items: readonly DocumentSpecificationListItem[]
  onEdit?: (item: DocumentSpecificationListItem) => void
  onDuplicate?: (item: DocumentSpecificationListItem) => void
}

export const DocumentSpecificationsTable = ({
  items,
  onEdit,
  onDuplicate,
}: DocumentSpecificationsTableProps) => (
  <div className='overflow-x-auto rounded-lg border border-border bg-card'>
    <Table className='min-w-[64rem]'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[18rem] px-3 py-2.5 text-[11px] tracking-[0.035em]'>
            Modelo
          </TableHead>
          <TableHead className='px-3 py-2.5 text-[11px] tracking-[0.035em]'>
            Aplicação
          </TableHead>
          <TableHead className='w-[8.75rem] px-3 py-2.5 text-[11px] tracking-[0.035em]'>
            Obrigatoriedade
          </TableHead>
          <TableHead className='w-[7rem] px-3 py-2.5 text-[11px] tracking-[0.035em]'>
            Estado
          </TableHead>
          <TableHead className='w-[11rem] px-3 py-2.5 text-[11px] tracking-[0.035em]'>
            Ação
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.documentSpecificationId} tabIndex={0} className='h-16'>
            <TableCell className='max-w-[18rem] px-3 py-2'>
              <div className='text-sm font-semibold leading-5'>{item.name}</div>
              <div
                className='mt-0.5 truncate text-xs leading-5 text-muted-foreground'
                title={item.description}
              >
                {item.description}
              </div>
            </TableCell>
            <TableCell className='px-3 py-2'>
              <DocumentSpecificationsApplication item={item} />
            </TableCell>
            <TableCell className='px-3 py-2'>
              <span className='inline-flex items-center gap-1.5 text-xs font-semibold'>
                <Icon
                  name={item.isRequired ? 'shield-check' : 'circle'}
                  className='size-3.5'
                />
                {item.isRequired ? 'Obrigatório' : 'Opcional'}
              </span>
            </TableCell>
            <TableCell className='px-3 py-2'>
              <Badge
                variant={item.status === 'available' ? 'secondary' : 'outline'}
                className='rounded-xl px-2 py-1 text-xs'
              >
                <Icon name={item.status === 'available' ? 'check' : 'clock'} />
                {item.status === 'available' ? 'Disponível' : 'Indisponível'}
              </Badge>
            </TableCell>
            <TableCell className='px-3 py-2'>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='brand'
                  size='sm'
                  className='h-9 rounded-full px-3 text-xs'
                  aria-label={`Editar ${item.name}`}
                  onClick={() => onEdit?.(item)}
                >
                  <Icon name='pencil' />
                  Editar
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-xs'
                  aria-label={`Duplicar ${item.name}`}
                  onClick={() => onDuplicate?.(item)}
                  className='text-muted-foreground hover:text-foreground'
                >
                  <Icon name='copy' />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
)
