import type { CollaboratorListQuery } from '@hms/core/identity/domain/structures'
import { UserStatus } from '@hms/core/identity/domain/structures'
import { Link } from '@tanstack/react-router'

import { CollaboratorAvatar } from '@/ui/identity/widgets/components/collaborator-avatar'
import { CollaboratorEditDialog } from '@/ui/identity/widgets/components/collaborator-edit-dialog'
import { CollaboratorFilterSelect } from '@/ui/identity/widgets/components/collaborator-filter-select'
import { CollaboratorsTableSkeleton } from '@/ui/identity/widgets/components/collaborators-table-skeleton'
import { Icon } from '@/ui/shared/widgets/components/icon'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Input } from '@/ui/shadcn/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useCollaboratorsPage } from './use-collaborators-page'

export type CollaboratorsPageProps = {
  onCreateCollaborator?: () => void
  successMessage?: string
}

export function CollaboratorsPage({
  onCreateCollaborator,
  successMessage,
}: CollaboratorsPageProps) {
  const {
    actionError,
    collaboratorsPage,
    collaboratorsPageError,
    isActionPending,
    isLoadingCollaborators,
    jobTitles,
    page,
    profileLabels,
    query,
    selectedAction,
    selectedEditCollaborator,
    statusLabels,
    totalPages,
    refetch,
    formatCollaboratorLastAccess,
    getCollaboratorActionButtonLabel,
    getCollaboratorActionDescription,
    getCollaboratorActionIcon,
    getCollaboratorActionTitle,
    isDestructiveCollaboratorAction,
    handleActionDialogOpenChange,
    handleClearFilters,
    handleConfirmAction,
    handleEditDialogOpenChange,
    handleEditSuccess,
    handleOpenEdit,
    handleOpenAction,
    handleUpdateSearch,
  } = useCollaboratorsPage({ successMessage })

  return (
    <main className='mx-auto w-full space-y-7' aria-labelledby='collaborators-page-title'>
      <header className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='mb-2 text-xs font-semibold tracking-[0.16em] text-brand-accent'>
            EQUIPE
          </p>
          <h1
            id='collaborators-page-title'
            className='font-serif text-4xl font-medium tracking-tight text-brand'
          >
            Colaboradores
          </h1>
          <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
            Gerencie os acessos e as responsabilidades da equipe HMS.
          </p>
        </div>
        <Button onClick={onCreateCollaborator} disabled={!onCreateCollaborator}>
          <Icon name='user' /> Criar colaborador
        </Button>
      </header>

      <section
        className='rounded-xl border border-border bg-card p-4 shadow-sm'
        aria-label='Filtros de colaboradores'
      >
        <div className='grid gap-3 md:grid-cols-[minmax(14rem,1fr)_10rem_12rem_11rem_auto] md:items-end'>
          <div className='space-y-2 text-sm font-medium'>
            <label
              htmlFor='collaborator-search'
              className='block font-bold text-foreground'
            >
              Buscar
            </label>
            <span className='relative block'>
              <Icon
                name='search'
                className='pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground'
              />
              <Input
                value={query.search ?? ''}
                onChange={(event) =>
                  handleUpdateSearch({ search: event.target.value || undefined })
                }
                placeholder='Nome ou e-mail'
                className='pl-9'
                id='collaborator-search'
                aria-label='Buscar por nome ou e-mail'
              />
            </span>
          </div>
          <CollaboratorFilterSelect
            label='Perfil'
            value={query.profile}
            placeholder='Todos'
            onValueChange={(value) =>
              handleUpdateSearch({
                profile:
                  value === 'all'
                    ? undefined
                    : (value as CollaboratorListQuery['profile']),
              })
            }
            options={Object.entries(profileLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <CollaboratorFilterSelect
            label='Cargo'
            value={query.jobTitle}
            placeholder='Todos os cargos'
            onValueChange={(value) =>
              handleUpdateSearch({ jobTitle: value === 'all' ? undefined : value })
            }
            options={(jobTitles ?? []).map((value) => ({
              value,
              label: value,
            }))}
          />
          <CollaboratorFilterSelect
            label='Status'
            value={query.status}
            placeholder='Todos'
            onValueChange={(value) =>
              handleUpdateSearch({
                status:
                  value === 'all'
                    ? undefined
                    : (value as CollaboratorListQuery['status']),
              })
            }
            options={Object.entries(statusLabels).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Button
            type='button'
            variant='ghost'
            onClick={handleClearFilters}
            className='gap-2'
          >
            <Icon name='refresh-cw' /> Limpar
          </Button>
        </div>
      </section>

      <section
        className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'
        aria-label='Lista de colaboradores'
      >
        {isLoadingCollaborators ? (
          <CollaboratorsTableSkeleton />
        ) : collaboratorsPageError ? (
          <div className='flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center'>
            <p className='font-medium text-destructive'>
              Não foi possível carregar os colaboradores.
            </p>
            <p className='text-sm text-muted-foreground'>
              Tente novamente ou limpe os filtros.
            </p>
            <Button variant='outline' onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : collaboratorsPage && collaboratorsPage.items.length > 0 ? (
          <>
            <div className='overflow-x-auto'>
              <Table className='w-full min-w-[46rem]'>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead className='w-20 text-right'>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaboratorsPage.items.map((collaborator) => (
                    <TableRow key={collaborator.collaboratorId}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <CollaboratorAvatar
                            name={collaborator.professionalName}
                            colorSeed={collaborator.collaboratorId}
                          />
                          <div className='min-w-0'>
                            <div className='truncate font-medium text-foreground'>
                              {collaborator.professionalName}
                            </div>
                            <div className='truncate text-xs text-muted-foreground'>
                              {collaborator.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {profileLabels[collaborator.profile] ?? collaborator.profile}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            collaborator.status === UserStatus.Disabled
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {statusLabels[collaborator.status] ?? collaborator.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='whitespace-nowrap text-muted-foreground'>
                        {formatCollaboratorLastAccess(collaborator.lastAccessAt)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon-sm'
                              aria-label={`Ações de ${collaborator.professionalName}`}
                            >
                              <Icon name='ellipsis' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end' className='w-48'>
                            <DropdownMenuItem asChild>
                              <Link
                                to='/colaboradores/$colaboradorId'
                                params={{ colaboradorId: collaborator.collaboratorId }}
                              >
                                <Icon name='eye' className='size-4 shrink-0' /> Ver
                                detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleOpenEdit(collaborator)}
                            >
                              <Icon name='pencil' className='size-4 shrink-0' /> Editar
                            </DropdownMenuItem>
                            {collaborator.status === UserStatus.Invited && (
                              <DropdownMenuItem
                                onSelect={() => handleOpenAction('resend', collaborator)}
                              >
                                <Icon name='send' className='size-4 shrink-0' /> Reenviar
                                convite
                              </DropdownMenuItem>
                            )}
                            {collaborator.status === UserStatus.Invited && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className='text-destructive focus:text-destructive'
                                  onSelect={() =>
                                    handleOpenAction('cancel-invitation', collaborator)
                                  }
                                >
                                  <Icon name='x' className='size-4 shrink-0' /> Cancelar
                                  convite
                                </DropdownMenuItem>
                              </>
                            )}
                            {collaborator.status === UserStatus.Active && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className='text-destructive focus:text-destructive'
                                  onSelect={() =>
                                    handleOpenAction('deactivate', collaborator)
                                  }
                                >
                                  <Icon name='user-x' className='size-4 shrink-0' />{' '}
                                  Inativar
                                </DropdownMenuItem>
                              </>
                            )}
                            {collaborator.status === UserStatus.Disabled &&
                              collaborator.lastAccessAt && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={() =>
                                      handleOpenAction('reactivate', collaborator)
                                    }
                                  >
                                    <Icon name='refresh-cw' className='size-4 shrink-0' />{' '}
                                    Reativar
                                  </DropdownMenuItem>
                                </>
                              )}
                            {collaborator.status === UserStatus.Disabled &&
                              !collaborator.lastAccessAt && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className='text-destructive focus:text-destructive'
                                    onSelect={() =>
                                      handleOpenAction('remove', collaborator)
                                    }
                                  >
                                    <Icon name='user-x' className='size-4 shrink-0' />{' '}
                                    Remover colaborador
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <footer className='flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
              <span>
                {collaboratorsPage.total} colaborador
                {collaboratorsPage.total === 1 ? '' : 'es'}
              </span>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label='Página anterior'
                  disabled={page <= 1}
                  onClick={() => handleUpdateSearch({ page: page - 1 })}
                >
                  <Icon name='chevron-left' />
                </Button>
                <span>
                  Página {page} de {Math.max(totalPages, 1)}
                </span>
                <Button
                  variant='outline'
                  size='icon-sm'
                  aria-label='Próxima página'
                  disabled={page >= totalPages}
                  onClick={() => handleUpdateSearch({ page: page + 1 })}
                >
                  <Icon name='chevron-right' />
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className='flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center'>
            <h2 className='font-serif text-xl text-brand'>
              {query.search || query.profile || query.status || query.jobTitle
                ? 'Nenhum colaborador encontrado'
                : 'Ainda não há colaboradores'}
            </h2>
            <p className='max-w-md text-sm text-muted-foreground'>
              {query.search || query.profile || query.status || query.jobTitle
                ? 'Ajuste ou limpe os filtros para tentar novamente.'
                : 'Crie o primeiro colaborador para começar a montar sua equipe.'}
            </p>
            {(query.search || query.profile || query.status || query.jobTitle) && (
              <Button variant='outline' onClick={handleClearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </section>
      <AlertDialog
        open={Boolean(selectedAction)}
        onOpenChange={(open) => {
          handleActionDialogOpenChange(open)
        }}
      >
        <AlertDialogContent className='max-w-[calc(100%-2rem)] gap-0 p-0 sm:max-w-[480px]'>
          <AlertDialogHeader className='place-items-start gap-2 p-6 text-left'>
            <AlertDialogMedia
              className={
                isDestructiveCollaboratorAction(selectedAction)
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-brand-accent/10 text-brand'
              }
            >
              <Icon name={getCollaboratorActionIcon(selectedAction)} />
            </AlertDialogMedia>
            <AlertDialogTitle className='font-serif text-2xl text-brand'>
              {getCollaboratorActionTitle(selectedAction)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getCollaboratorActionDescription(selectedAction)}
            </AlertDialogDescription>
            {actionError && (
              <div
                role='alert'
                className='rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive'
              >
                <p className='font-semibold'>Não foi possível concluir a ação.</p>
                <p className='mt-1'>
                  {actionError instanceof Error
                    ? actionError.message
                    : 'Tente novamente ou atualize a situação do colaborador.'}
                </p>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className='m-0 rounded-none bg-muted/50 p-4'>
            <AlertDialogCancel disabled={isActionPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isActionPending}
              onClick={(event) => {
                void handleConfirmAction(event).catch(() => undefined)
              }}
              className={
                isDestructiveCollaboratorAction(selectedAction)
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : undefined
              }
            >
              {isActionPending
                ? 'Processando…'
                : getCollaboratorActionButtonLabel(selectedAction)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {selectedEditCollaborator && (
        <CollaboratorEditDialog
          open={Boolean(selectedEditCollaborator)}
          collaborator={selectedEditCollaborator}
          onOpenChange={handleEditDialogOpenChange}
          onSuccess={handleEditSuccess}
        />
      )}
    </main>
  )
}
