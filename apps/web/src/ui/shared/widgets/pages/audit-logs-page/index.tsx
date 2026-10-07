import {
  AuditEventOrigin,
  AuditEventStatus,
  type AuditEventEntityType,
} from '@hms/core/shared/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { AuditFilterSelect } from '@/ui/shared/widgets/components/audit-filter-select'
import { AuditLogDetailBlock } from '@/ui/shared/widgets/components/audit-log-detail-block'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Input } from '@/ui/shadcn/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/shadcn/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useAuditLogsPage } from './use-audit-logs-page'

const entityOptions: readonly [AuditEventEntityType, string][] = [
  ['intake', 'Intake'],
  ['case', 'Caso'],
  ['document', 'Documento'],
  ['piece', 'Peça'],
  ['checklist', 'Checklist'],
  ['task', 'Tarefa'],
  ['deadline', 'Prazo'],
  ['permission', 'Permissão'],
  ['client', 'Cliente'],
  ['third_party', 'Terceiro'],
  ['external_access', 'Acesso externo'],
  ['document_validation', 'Validação documental'],
  ['document_exception', 'Exceção documental'],
  ['audit_log_export', 'Exportação de auditoria'],
]

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export type AuditLogsPageProps = Record<string, never>

export const AuditLogsPage = (_props: AuditLogsPageProps) => {
  const {
    action,
    auditLog,
    auditLogError,
    auditLogs,
    auditLogsError,
    entityType,
    handleActionChange,
    handleEntityTypeChange,
    handleExport,
    handleEventExport,
    handleFromChange,
    handleOriginChange,
    handleStatusChange,
    handleToChange,
    getActionLabel,
    getEntityLabel,
    getOriginLabel,
    isLoadingAuditLog,
    isLoadingAuditLogs,
    isExporting,
    exportError,
    origin,
    from,
    page,
    refetch,
    selectedAuditLogId,
    setPage,
    setSelectedAuditLogId,
    status,
    to,
    totalPages,
  } = useAuditLogsPage()

  return (
    <main className='mx-auto w-full space-y-7' aria-labelledby='audit-logs-page-title'>
      <header className='border-b border-border pb-6'>
        <p className='mb-2 text-xs font-semibold tracking-[0.16em] text-brand-accent'>
          GOVERNANÇA
        </p>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h1
              id='audit-logs-page-title'
              className='font-serif text-4xl font-medium text-brand'
            >
              Auditoria
            </h1>
            <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
              Consulte os eventos operacionais registrados na plataforma.
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className='rounded-full'
                variant='outline'
                disabled={isExporting}
                aria-label='Baixar auditoria'
              >
                <Icon name='download' /> Baixar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onSelect={() => void handleExport('csv')}>
                <Icon name='download' className='size-4' /> Baixar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void handleExport('json')}>
                <Icon name='download' className='size-4' /> Baixar JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {exportError && (
          <p role='alert' className='mt-3 text-sm text-destructive'>
            Não foi possível exportar os eventos.
          </p>
        )}
      </header>

      <section className='grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6'>
        <div className='space-y-2'>
          <label htmlFor='audit-action' className='text-sm font-medium'>
            Ação
          </label>
          <div className='relative'>
            <Icon
              name='search'
              className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              id='audit-action'
              value={action}
              onChange={(event) => handleActionChange(event.target.value)}
              placeholder='Buscar ação'
              className='pl-9'
            />
          </div>
        </div>
        <div className='space-y-2'>
          <label htmlFor='audit-from' className='text-sm font-medium'>
            De
          </label>
          <Input
            id='audit-from'
            type='date'
            value={from}
            onChange={(event) => handleFromChange(event.target.value)}
          />
        </div>
        <div className='space-y-2'>
          <label htmlFor='audit-to' className='text-sm font-medium'>
            Até
          </label>
          <Input
            id='audit-to'
            type='date'
            value={to}
            onChange={(event) => handleToChange(event.target.value)}
          />
        </div>
        <AuditFilterSelect
          id='audit-entity'
          label='Entidade'
          value={entityType}
          onChange={(value) => handleEntityTypeChange(value as AuditEventEntityType | '')}
          options={entityOptions}
        />
        <AuditFilterSelect
          id='audit-origin'
          label='Origem'
          value={origin}
          onChange={(value) => handleOriginChange(value as typeof origin)}
          options={[
            ['human', 'Humano'],
            ['system', 'Sistema'],
            ['ai', 'IA'],
            ['integration', 'Integração'],
          ]}
        />
        <AuditFilterSelect
          id='audit-status'
          label='Status'
          value={status}
          onChange={(value) => handleStatusChange(value as typeof status)}
          options={[
            ['success', 'Sucesso'],
            ['failure', 'Falha'],
          ]}
        />
      </section>

      <section
        className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'
        aria-label='Lista de eventos de auditoria'
      >
        {isLoadingAuditLogs ? (
          <div className='flex min-h-64 items-center justify-center text-sm text-muted-foreground'>
            Carregando eventos...
          </div>
        ) : auditLogsError ? (
          <div className='flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center'>
            <p className='font-medium text-destructive'>
              Não foi possível carregar a auditoria.
            </p>
            <Button variant='outline' onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className='flex min-h-64 items-center justify-center px-6 text-sm text-muted-foreground'>
            Nenhum evento encontrado.
          </div>
        ) : (
          <div className='w-full'>
            <Table
              className='w-full table-auto [&_td]:px-3 [&_th]:px-3 lg:[&_td]:px-4 lg:[&_th]:px-4'
              containerClassName='overflow-x-hidden'
            >
              <TableHeader>
                <TableRow>
                  <TableHead className='hidden lg:table-cell'>Data</TableHead>
                  <TableHead className='hidden lg:table-cell'>Entidade</TableHead>
                  <TableHead className='hidden lg:table-cell'>Ação</TableHead>
                  <TableHead className='hidden sm:table-cell'>Origem</TableHead>
                  <TableHead className='w-24'>Status</TableHead>
                  <TableHead className='w-28'>Responsável</TableHead>
                  <TableHead className='w-32 text-right'>Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((event) => (
                  <TableRow
                    key={event.id}
                    className='cursor-pointer'
                    tabIndex={0}
                    onClick={() => setSelectedAuditLogId(event.id)}
                    onKeyDown={(keyboardEvent) => {
                      if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                        keyboardEvent.preventDefault()
                        setSelectedAuditLogId(event.id)
                      }
                    }}
                  >
                    <TableCell className='hidden lg:table-cell'>
                      {formatDate(event.occurredAt)}
                    </TableCell>
                    <TableCell className='hidden truncate lg:table-cell'>
                      {getEntityLabel(event.entityType)}
                    </TableCell>
                    <TableCell className='hidden truncate font-medium lg:table-cell'>
                      {getActionLabel(event.action)}
                    </TableCell>
                    <TableCell className='hidden sm:table-cell'>
                      {event.origin === AuditEventOrigin.Ai ? (
                        <Badge variant='info'>IA</Badge>
                      ) : (
                        getOriginLabel(event.origin)
                      )}
                    </TableCell>
                    <TableCell className='truncate'>
                      <Badge
                        variant={
                          event.status === AuditEventStatus.Success
                            ? 'success'
                            : 'destructive'
                        }
                      >
                        {event.status === AuditEventStatus.Success ? 'Sucesso' : 'Falha'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className='w-32 max-w-32 overflow-hidden text-ellipsis whitespace-nowrap'
                      title={event.actorProfile ?? event.actorId ?? 'Sistema'}
                    >
                      {event.actorProfile ?? event.actorId ?? 'Sistema'}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1.5'>
                        <Button
                          type='button'
                          size='xs'
                          variant='outline'
                          className='rounded-full'
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation()
                            handleEventExport('csv', event)
                          }}
                          onKeyDown={(keyboardEvent) => keyboardEvent.stopPropagation()}
                        >
                          CSV
                        </Button>
                        <Button
                          type='button'
                          size='xs'
                          variant='outline'
                          className='rounded-full'
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation()
                            handleEventExport('json', event)
                          }}
                          onKeyDown={(keyboardEvent) => keyboardEvent.stopPropagation()}
                        >
                          JSON
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {!isLoadingAuditLogs && !auditLogsError && auditLogs.length > 0 && (
          <div className='flex items-center justify-between border-t border-border p-4'>
            <span className='text-sm text-muted-foreground'>
              Página {page} de {totalPages}
            </span>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='rounded-full'
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant='outline'
                className='rounded-full'
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </section>

      <Sheet
        open={Boolean(selectedAuditLogId)}
        onOpenChange={(open) => {
          if (!open) setSelectedAuditLogId(undefined)
        }}
      >
        <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader>
            <SheetTitle>Detalhes do evento</SheetTitle>
            <SheetDescription>
              Registro somente leitura da trilha de auditoria.
            </SheetDescription>
          </SheetHeader>
          {isLoadingAuditLog ? (
            <p className='px-4 text-sm text-muted-foreground'>Carregando detalhes...</p>
          ) : auditLogError ? (
            <p className='px-4 text-sm text-destructive'>
              Não foi possível carregar o evento.
            </p>
          ) : (
            auditLog && (
              <div className='space-y-5 px-4 pb-6'>
                <dl className='grid gap-3 text-sm sm:grid-cols-2'>
                  <div>
                    <dt className='text-muted-foreground'>Data</dt>
                    <dd>{formatDate(auditLog.occurredAt)}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Entidade</dt>
                    <dd>{getEntityLabel(auditLog.entityType)}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Ação</dt>
                    <dd>{getActionLabel(auditLog.action)}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>IP</dt>
                    <dd>{auditLog.ipAddress ?? '—'}</dd>
                  </div>
                </dl>
                <AuditLogDetailBlock
                  title='Justificativa'
                  value={auditLog.justification}
                />
                <AuditLogDetailBlock title='Valor anterior' value={auditLog.beforeData} />
                <AuditLogDetailBlock title='Valor novo' value={auditLog.afterData} />
                <AuditLogDetailBlock title='Metadados' value={auditLog.metadata} />
              </div>
            )
          )}
        </SheetContent>
      </Sheet>
    </main>
  )
}
