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
import { TableSurface } from '@/ui/shared/widgets/components/table-surface'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/ui/shadcn/pagination'
import { useDynamicFormsTable } from './use-dynamic-forms-table'
import type { DynamicFormsTableProps } from './types'
import { DynamicFormActions } from '../dynamic-form-actions'

export type { DynamicFormsTableProps } from './types'

export const DynamicFormsTable = (props: DynamicFormsTableProps) => {
  const {
    visibleItems,
    pageNumbers,
    showLeadingEllipsis,
    showTrailingEllipsis,
    getTopicSummary,
    handlePageChange,
  } = useDynamicFormsTable(props)
  const startItem = props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1
  const endItem = Math.min(props.page * props.pageSize, props.total)
  const isPreviousDisabled = props.isPending || props.page <= 1
  const isNextDisabled = props.isPending || props.page >= props.pageCount

  return (
    <div className='space-y-4'>
      <TableSurface ariaLabel='Lista de formulários dinâmicos'>
        <div className='md:hidden'>
          <ul className='divide-y divide-border'>
            {visibleItems.map((item) => (
              <li key={item.id} className='space-y-3 p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='truncate font-semibold' title={item.name}>
                      {item.name}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {item.description ?? 'Sem descrição'}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <Button
                      variant='brand'
                      size='sm'
                      onClick={() => props.onEdit(item.id)}
                    >
                      Editar
                    </Button>
                    <DynamicFormActions
                      form={item}
                      onDuplicate={props.onDuplicate}
                      onChangeAvailability={props.onChangeAvailability}
                      onDelete={props.onDelete}
                    />
                  </div>
                </div>
                <dl className='grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <dt className='text-muted-foreground'>Etapa</dt>
                    <dd>{item.stage === 'consultation' ? 'Consulta' : 'Formalização'}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Área jurídica</dt>
                    <dd>{item.legalArea.name}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Temas</dt>
                    <dd>{getTopicSummary(item)}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Campos</dt>
                    <dd>{item.fieldCount}</dd>
                  </div>
                </dl>
                <Badge variant={item.status === 'available' ? 'secondary' : 'outline'}>
                  {item.status === 'available' ? 'Disponível' : 'Indisponível'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className='hidden overflow-x-auto md:block'>
          <Table className='w-full min-w-[64rem] table-fixed xl:min-w-0'>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[22%]'>Formulário</TableHead>
                <TableHead className='w-[9%]'>Etapa</TableHead>
                <TableHead className='w-[14%]'>Área jurídica</TableHead>
                <TableHead className='w-[17%]'>Temas</TableHead>
                <TableHead className='w-[9%]'>Campos</TableHead>
                <TableHead className='w-[12%]'>Estado</TableHead>
                <TableHead className='w-[17%] text-right'>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='max-w-[18rem]'>
                    <p className='truncate font-semibold' title={item.name}>
                      {item.name}
                    </p>
                    <p
                      className='truncate text-xs text-muted-foreground'
                      title={item.description ?? ''}
                    >
                      {item.description ?? 'Sem descrição'}
                    </p>
                  </TableCell>
                  <TableCell>
                    {item.stage === 'consultation' ? 'Consulta' : 'Formalização'}
                  </TableCell>
                  <TableCell>{item.legalArea.name}</TableCell>
                  <TableCell>{getTopicSummary(item)}</TableCell>
                  <TableCell>{item.fieldCount}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.status === 'available' ? 'secondary' : 'outline'}
                    >
                      {item.status === 'available' ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center justify-end gap-2'>
                      <Button
                        variant='brand'
                        size='sm'
                        onClick={() => props.onEdit(item.id)}
                      >
                        Editar
                      </Button>
                      <DynamicFormActions
                        form={item}
                        onDuplicate={props.onDuplicate}
                        onChangeAvailability={props.onChangeAvailability}
                        onDelete={props.onDelete}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableSurface>
      <Pagination
        aria-label='Paginação de formulários dinâmicos'
        className='justify-between gap-3'
      >
        <span className='text-sm text-muted-foreground'>
          Exibindo {startItem}–{endItem} de {props.total}
        </span>
        <PaginationContent className='gap-1'>
          <PaginationItem>
            <PaginationPrevious
              href='#'
              aria-label='Anterior'
              aria-disabled={isPreviousDisabled || undefined}
              tabIndex={isPreviousDisabled ? -1 : undefined}
              className={
                isPreviousDisabled ? 'pointer-events-none opacity-50' : undefined
              }
              onClick={(event) => {
                event.preventDefault()
                if (!isPreviousDisabled) handlePageChange(props.page - 1)
              }}
            />
          </PaginationItem>
          {showLeadingEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {pageNumbers.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href='#'
                aria-label={`Página ${pageNumber}`}
                isActive={props.page === pageNumber}
                onClick={(event) => {
                  event.preventDefault()
                  handlePageChange(pageNumber)
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          {showTrailingEllipsis && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationNext
              href='#'
              aria-label='Próxima'
              aria-disabled={isNextDisabled || undefined}
              tabIndex={isNextDisabled ? -1 : undefined}
              className={isNextDisabled ? 'pointer-events-none opacity-50' : undefined}
              onClick={(event) => {
                event.preventDefault()
                if (!isNextDisabled) handlePageChange(props.page + 1)
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
