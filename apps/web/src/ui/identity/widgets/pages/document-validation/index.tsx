import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { TableSurface } from '@/ui/shared/widgets/components/table-surface'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/ui/shadcn/pagination'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useDocumentInbox } from './use-document-inbox'

export const DocumentInboxPage = () => {
  const { 
    currentPage, 
    totalPages, 
    totalItems, 
    paginatedData, 
    handlePageChange, 
    handleAnalyze, 
    handleRefresh 
  } = useDocumentInbox()

  const startItem = (currentPage - 1) * 6 + 1
  const endItem = Math.min(currentPage * 6, totalItems)

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-brand">
            Caixa de documentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revise os documentos recebidos e encaminhe cada um para validação.
          </p>
        </div>
        <Button variant="outline" className="rounded-pill bg-white" onClick={handleRefresh}>
          Atualizar
        </Button>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <NativeSelect className="w-full">
              <NativeSelectOption value="">Todos os status</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Cliente</label>
            <NativeSelect className="w-full">
              <NativeSelectOption value="">Todos os clientes</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data de recebimento</label>
            <NativeSelect className="w-full">
              <NativeSelectOption value="">Data inicial — Data final</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-brand">
            Limpar filtros
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon name="inbox" className="size-4 text-brand" />
          Documentos recebidos
        </div>

        <TableSurface>
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow>
                <TableHead className="w-[300px]">DOCUMENTO</TableHead>
                <TableHead>RECEBIDO DE</TableHead>
                <TableHead>CASO / ITEM SUGERIDO</TableHead>
                <TableHead>RECEBIDO</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">AÇÃO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                        <Icon name="file-text" className="size-4 text-brand" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-foreground">
                          {doc.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doc.fileName.split('.').pop()?.toUpperCase()} • {doc.fileSize}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <Icon name={doc.receivedFromIcon as any} className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{doc.receivedFrom}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{doc.contactInfo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-brand">{doc.caseId}</span>
                        {doc.caseId.includes('Caso') && (
                          <Icon name="external-link" className="size-3.5 text-brand" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{doc.caseDesc}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{doc.receivedDate}</span>
                      <span className="text-xs text-muted-foreground">{doc.receivedTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={doc.badgeVariant as any} className="gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                      <span className={`size-1.5 rounded-full ${doc.badgeVariant === 'success' ? 'bg-emerald-500' : doc.badgeVariant === 'destructive' ? 'bg-red-500' : doc.badgeVariant === 'attention' ? 'bg-amber-500' : 'bg-muted-foreground'}`} />
                      {doc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      className="rounded-pill border-brand text-brand hover:bg-brand/5"
                      onClick={() => handleAnalyze(doc.id)}
                    >
                      Analisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex items-center justify-between border-t border-border bg-card px-6 py-4">
            <span className="text-sm text-muted-foreground">
              Exibindo {startItem}–{endItem} de {totalItems} documentos
            </span>
            <Pagination className="w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === page}
                        onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </TableSurface>
      </div>
    </div>
  )
}