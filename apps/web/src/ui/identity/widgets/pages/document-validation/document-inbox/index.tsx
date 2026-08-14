import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { TableSurface } from '@/ui/shared/widgets/components/table-surface'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/ui/shadcn/pagination'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'
import { Calendar } from '@/ui/shadcn/calendar'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useDocumentInbox } from './use-document-inbox'

export const DocumentInboxPage = () => {
  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,
    uniqueStatuses,
    handlePageChange,
    handleAnalyze,
    handleRefresh,
    handleApplyFilters,
    handleClearFilters,
  } = useDocumentInbox()

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * 6 + 1
  const endItem = Math.min(currentPage * 6, totalItems)

  return (
    <div className='flex w-full flex-col gap-6'>
      <header className='flex flex-col gap-3'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='font-serif text-3xl font-semibold text-brand'>
              Caixa de documentos
            </h1>
            <p className='mt-1 font-sans text-sm text-muted-foreground'>
              Revise os documentos recebidos e encaminhe cada um para validação.
            </p>
          </div>
          <Button
            variant='outline'
            className='rounded-pill bg-highlight px-5 font-semibold text-primary shadow-sm hover:bg-highlight-vivid hover:text-white'
            onClick={handleRefresh}
          >
            Atualizar
          </Button>
        </div>
      </header>

      <section className='flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-card'>
        <div className='flex flex-wrap items-center gap-4'>
          <span className='font-sans text-sm font-semibold text-foreground'>
            Filtros:
          </span>

          <NativeSelect
            size='sm'
            className='w-60 bg-card font-sans text-sm'
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <NativeSelectOption value=''>Todos os status</NativeSelectOption>
            {uniqueStatuses.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {status}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <NativeSelect size='sm' className='w-60 bg-card font-sans text-sm'>
            <NativeSelectOption value=''>Todos os clientes</NativeSelectOption>
          </NativeSelect>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={`h-9 w-64 justify-start rounded-md border border-input bg-card px-2.5 text-left font-sans text-sm font-normal ${
                  !dateRange?.from ? 'text-muted-foreground' : 'text-foreground'
                }`}
              >
                <Icon name='calendar' className='mr-2 size-3.5 opacity-70' />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}{' '}
                      —{' '}
                      {format(dateRange.to, 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </>
                  ) : (
                    format(dateRange.from, 'dd/MM/yyyy', {
                      locale: ptBR,
                    })
                  )
                ) : (
                  <span>Data inicial — Data final</span>
                )}
                <Icon name='chevron-down' className='ml-auto size-4 opacity-60' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[300px] p-0' align='start'>
              <Calendar
                mode='range'
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                locale={ptBR}
                className='w-full'
              />
            </PopoverContent>
          </Popover>

          <div className='ml-auto flex items-center gap-3'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-xs font-medium text-primary hover:text-primary'
              onClick={handleClearFilters}
            >
              Limpar filtros
            </Button>
            <Button
              type='button'
              variant='brand'
              size='sm'
              className='h-8 rounded-pill px-6 font-sans text-xs font-medium'
              onClick={handleApplyFilters}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </section>

      <div className='flex flex-col gap-3'>
        <div className='flex items-center gap-2 font-sans text-sm font-semibold text-foreground'>
          <Icon name='inbox' className='size-4 text-brand' />
          Documentos recebidos
        </div>

        <TableSurface className='shadow-card'>
          <Table>
            <TableHeader className='bg-muted/30'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[300px] text-[11px] font-semibold text-muted-foreground'>
                  DOCUMENTO
                </TableHead>
                <TableHead className='text-[11px] font-semibold text-muted-foreground'>
                  RECEBIDO DE
                </TableHead>
                <TableHead className='text-[11px] font-semibold text-muted-foreground'>
                  CASO / ITEM SUGERIDO
                </TableHead>
                <TableHead className='text-[11px] font-semibold text-muted-foreground'>
                  RECEBIDO
                </TableHead>
                <TableHead className='text-[11px] font-semibold text-muted-foreground'>
                  STATUS
                </TableHead>
                <TableHead className='text-right text-[11px] font-semibold text-muted-foreground'>
                  AÇÃO
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {totalItems === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='h-32 text-center font-sans text-muted-foreground'
                  >
                    Nenhum documento encontrado para este filtro.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className='flex items-start gap-3'>
                        <div className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50'>
                          <Icon name='file-text' className='size-4 text-primary' />
                        </div>
                        <div className='flex min-w-0 flex-col'>
                          <span className='truncate font-sans font-semibold text-foreground'>
                            {doc.fileName}
                          </span>
                          <span className='font-sans text-xs text-muted-foreground'>
                            {doc.fileName.split('.').pop()?.toUpperCase()} •{' '}
                            {doc.fileSize}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <div className='flex items-center gap-1.5'>
                          <Icon
                            name={doc.receivedFromIcon}
                            className='size-3.5 text-muted-foreground'
                          />
                          <span className='font-sans font-semibold text-foreground'>
                            {doc.receivedFrom}
                          </span>
                        </div>
                        <span className='font-sans text-xs text-muted-foreground'>
                          {doc.contactInfo}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <div className='flex items-center gap-1.5'>
                          <span
                            className={`font-sans font-semibold ${
                              doc.caseId.includes('Caso')
                                ? 'text-primary'
                                : 'text-foreground'
                            }`}
                          >
                            {doc.caseId}
                          </span>
                          {doc.caseId.includes('Caso') && (
                            <Icon
                              name='external-link'
                              className='size-3.5 text-primary'
                            />
                          )}
                        </div>
                        <span className='font-sans text-xs text-muted-foreground'>
                          {doc.caseDesc}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-0.5'>
                        <span className='font-sans font-semibold text-foreground'>
                          {doc.receivedDate}
                        </span>
                        <span className='font-sans text-xs text-muted-foreground'>
                          {doc.receivedTime}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`gap-1.5 rounded-pill border-0 px-2.5 py-0.5 font-sans text-[11px] font-semibold ${doc.badgeClasses}`}
                      >
                        <span className={`size-1.5 rounded-full ${doc.dotClasses}`} />
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='outline'
                        className='flex items-center justify-center rounded-full border-2 border-primary bg-transparent px-3 text-[14px] font-semibold text-primary hover:bg-[#3D757B] hover:text-white'
                        onClick={() => handleAnalyze(doc.id)}
                      >
                        Analisar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalItems > 0 && (
            <div className='flex w-full items-center border-t border-border bg-card px-6 py-4'>
              <span className='font-sans text-sm text-muted-foreground'>
                Exibindo {startItem}–{endItem} de {totalItems} documentos
              </span>
              <Pagination className='!ml-auto !mr-0 !w-auto !justify-end'>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationLink
                      href='#'
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(currentPage - 1)
                      }}
                      className={`flex size-8 items-center justify-center rounded-md border border-[#3D757B] p-0 text-[#3D757B] hover:bg-[#DCE9EA] hover:text-[#3D757B] ${
                        currentPage === 1 ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <Icon name='chevron-left' className='size-4' />
                    </PaginationLink>
                  </PaginationItem>
                  {totalPages <= 5 ? (
                    Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href='#'
                            isActive={currentPage === page}
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(page)
                            }}
                            className='flex size-8 items-center justify-center rounded-md border border-[#3D757B] p-0 text-[#3D757B] hover:bg-[#DCE9EA] hover:text-[#3D757B] data-[active=true]:bg-[#3D757B] data-[active=true]:text-white'
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })
                  ) : (
                    <>
                      {currentPage > 3 && (
                        <PaginationItem>
                          <span className='flex size-8 items-center justify-center text-[#3D757B]'>
                            ...
                          </span>
                        </PaginationItem>
                      )}

                      {Array.from({ length: 5 }, (_, i) => {
                        let page: number

                        if (currentPage <= 3) {
                          page = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i
                        } else {
                          page = currentPage - 2 + i
                        }

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href='#'
                              isActive={currentPage === page}
                              onClick={(e) => {
                                e.preventDefault()
                                handlePageChange(page)
                              }}
                              className='flex size-8 items-center justify-center rounded-md border border-[#3D757B] p-0 text-[#3D757B] hover:bg-[#DCE9EA] hover:text-[#3D757B] data-[active=true]:bg-[#3D757B] data-[active=true]:text-white'
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <span className='flex size-8 items-center justify-center text-[#3D757B]'>
                            ...
                          </span>
                        </PaginationItem>
                      )}
                    </>
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href='#'
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(currentPage + 1)
                      }}
                      className={`flex size-8 items-center justify-center rounded-md border border-[#3D757B] p-0 text-[#3D757B] hover:bg-[#DCE9EA] hover:text-[#3D757B] ${
                        currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <Icon name='chevron-right' className='size-4' />
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </TableSurface>
      </div>
    </div>
  )
}
