import type { DocumentSpecificationListItem } from '@hms/core/document-production/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { TableSurface } from '@/ui/shared/widgets/components/table-surface'

import { DocumentSpecificationsApplication } from '../document-specifications-application'

export type DocumentSpecificationsTableProps = {
  items: readonly DocumentSpecificationListItem[]
  onEdit?: (item: DocumentSpecificationListItem) => void
}

const getClassificationStyle = (classification?: string) => {
  switch (classification) {
    case 'Confidencial':
      return {
        className: 'border-red-500 bg-red-50 text-red-700',
        icon: 'shield-alert',
      }
    case 'Restrito':
      return {
        className: 'border-orange-500 bg-orange-50 text-orange-700',
        icon: 'lock',
      }
    case 'Cliente':
      return {
        className: 'border-blue-500 bg-blue-50 text-blue-700',
        icon: 'user',
      }
    case 'Parceiro liberado':
      return {
        className: 'border-purple-500 bg-purple-50 text-purple-700',
        icon: 'users',
      }
    default:
      return {
        className: 'border-gray-300 bg-gray-50 text-gray-700',
        icon: 'building',
      }
  }
}

export const DocumentSpecificationsTable = ({
  items,
  onEdit,
}: DocumentSpecificationsTableProps) => (
  <TableSurface ariaLabel='Lista de modelos de documentos'>
    <Table className='w-full min-w-[64rem] table-fixed'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[18rem]'>Modelo</TableHead>
          <TableHead>Aplicação</TableHead>
          <TableHead className='w-[11rem]'>Classificação</TableHead>
          <TableHead className='w-[7rem]'>Estado</TableHead>
          <TableHead className='w-[11rem] text-center'>Ação</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item) => {
          const badgeStyle = getClassificationStyle(item.accessClassification)

          return (
            <TableRow key={item.documentSpecificationId} tabIndex={0}>
              <TableCell className='w-[18rem] max-w-[18rem]'>
                <div
                  className='truncate text-sm font-semibold leading-5'
                  title={item.name}
                >
                  {item.name}
                </div>

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
                <Badge
                  variant='outline'
                  className={`gap-1 whitespace-nowrap ${badgeStyle.className}`}
                >
                  <Icon name={badgeStyle.icon as any} className='h-3 w-3' />
                  {item.accessClassification ?? 'Interno'}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant={item.status === 'available' ? 'secondary' : 'outline'}>
                  <Icon name={item.status === 'available' ? 'check' : 'clock'} />
                  {item.status === 'available' ? 'Disponível' : 'Indisponível'}
                </Badge>
              </TableCell>

              <TableCell className='text-center'>
                <div className='flex items-center justify-center gap-2'>
                  <Button
                    asChild
                    variant='brand'
                    size='sm'
                    className='h-9 rounded-full px-3 text-xs'
                    aria-label={`Editar ${item.name}`}
                  >
                    <Anchor
                      route='documentSpecification'
                      params={{
                        documentSpecificationId: item.documentSpecificationId,
                      }}
                      onClick={() => onEdit?.(item)}
                    >
                      <Icon name='pencil' />
                      Editar
                    </Anchor>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  </TableSurface>
)
