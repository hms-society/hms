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
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { TableSurface } from '@/ui/shared/widgets/components/table-surface'
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
  <TableSurface ariaLabel='Lista de modelos de documentos'>
    <Table className='w-full min-w-[64rem]'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[18rem]'>Modelo</TableHead>
          <TableHead>Aplicação</TableHead>
          <TableHead className='w-[8.75rem]'>Obrigatoriedade</TableHead>
          <TableHead className='w-[7rem]'>Estado</TableHead>
          <TableHead className='w-[11rem] text-right'>Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.documentSpecificationId} tabIndex={0}>
            <TableCell className='max-w-[18rem]'>
              <div className='text-sm font-semibold leading-5'>{item.name}</div>
              <div
                className='mt-0.5 truncate text-xs leading-5 text-muted-foreground'
                title={item.description}
              >
                {item.description}
              </div>
            </TableCell>
            <TableCell>
              <DocumentSpecificationsApplication item={item} />
            </TableCell>
            <TableCell>
              <span className='inline-flex items-center gap-1.5 text-xs font-semibold'>
                <Icon
                  name={item.isRequired ? 'shield-check' : 'circle'}
                  className='size-3.5'
                />
                {item.isRequired ? 'Obrigatório' : 'Opcional'}
              </span>
            </TableCell>
            <TableCell>
              <Badge variant={item.status === 'available' ? 'secondary' : 'outline'}>
                <Icon name={item.status === 'available' ? 'check' : 'clock'} />
                {item.status === 'available' ? 'Disponível' : 'Indisponível'}
              </Badge>
            </TableCell>
            <TableCell className='text-right'>
              <div className='flex items-center justify-end gap-2'>
                <Button
                  asChild
                  variant='brand'
                  size='sm'
                  className='h-9 rounded-full px-3 text-xs'
                  aria-label={`Editar ${item.name}`}
                >
                  <Anchor
                    route='documentSpecification'
                    params={{ documentSpecificationId: item.documentSpecificationId }}
                    onClick={() => onEdit?.(item)}
                  >
                    <Icon name='pencil' />
                    Editar
                  </Anchor>
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
  </TableSurface>
)
