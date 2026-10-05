import { ThirdPartyStatus } from '@hms/core/identity/domain/structures'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { ThirdPartyEditDialog } from '@/ui/identity/widgets/components/third-party-edit-dialog'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/shadcn/table'
import { useThirdPartiesPage } from './use-third-parties-page'

export type ThirdPartiesPageProps = { onCreateThirdParty?: () => void }

export const ThirdPartiesPage = ({ onCreateThirdParty }: ThirdPartiesPageProps) => {
  const {
    filteredThirdParties,
    handleActionDialogOpenChange,
    handleConfirmAction,
    getRelationshipLabels,
    getTypeLabel,
    isLoadingThirdParties,
    isUpdatingThirdPartyStatus,
    refetch,
    search,
    setSearch,
    setStatus,
    selectedAction,
    selectedEditThirdParty,
    setSelectedEditThirdParty,
    setSelectedAction,
    status,
    thirdPartiesError,
    updateThirdPartyStatusError,
  } = useThirdPartiesPage()

  function getDocumentTypeLabel(type: string) {
    return (
      (
        {
          cnpj: 'CNPJ',
          official_registration: 'Registro oficial equivalente',
          other_national_document: 'Outro documento nacional',
        } as Record<string, string>
      )[type] ?? type
    )
  }

  return (
    <main className='mx-auto w-full space-y-7' aria-labelledby='third-parties-page-title'>
      <header className='flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='mb-2 text-xs font-semibold tracking-[0.16em] text-brand-accent'>
            GOVERNANÇA
          </p>
          <h1
            id='third-parties-page-title'
            className='font-serif text-4xl font-medium tracking-tight text-brand'
          >
            Terceiros
          </h1>
          <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
            Cadastre entidades parceiras e acompanhe seus acessos externos.
          </p>
        </div>
        <Button className='rounded-full' onClick={onCreateThirdParty}>
          <Icon name='plus' /> Novo terceiro
        </Button>
      </header>
      <section className='grid items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-[minmax(14rem,1fr)_12rem]'>
        <div className='space-y-2'>
          <label htmlFor='third-parties-search' className='sr-only'>
            Buscar por nome ou documento
          </label>
          <div className='relative'>
            <Icon
              name='search'
              className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              id='third-parties-search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Nome ou documento'
              className='pl-9'
            />
          </div>
        </div>
        <div className='space-y-2'>
          <label htmlFor='third-parties-status' className='text-sm font-medium'>
            Status
          </label>
          <select
            id='third-parties-status'
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as 'all' | ThirdPartyStatus)
            }
            className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm'
          >
            <option value='all'>Todos</option>
            <option value='active'>Ativos</option>
            <option value='inactive'>Inativos</option>
          </select>
        </div>
      </section>
      <section
        className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'
        aria-label='Lista de terceiros'
      >
        {isLoadingThirdParties ? (
          <div className='flex min-h-64 items-center justify-center text-sm text-muted-foreground'>
            Carregando terceiros...
          </div>
        ) : thirdPartiesError ? (
          <div className='flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center'>
            <p className='font-medium text-destructive'>
              Não foi possível carregar os terceiros.
            </p>
            <Button variant='outline' onClick={() => void refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : filteredThirdParties.length === 0 ? (
          <div className='flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center'>
            <h2 className='font-serif text-xl text-brand'>Nenhum terceiro encontrado</h2>
            <p className='text-sm text-muted-foreground'>
              Ajuste os filtros ou cadastre uma nova entidade.
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table className='min-w-[54rem]'>
              <TableHeader>
                <TableRow>
                  <TableHead>Terceiro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead className='min-w-64'>Vínculo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='w-44 text-center'>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThirdParties.map((thirdParty) => (
                  <TableRow key={thirdParty.id}>
                    <TableCell>
                      <div className='font-medium'>
                        {thirdParty.tradeName ?? thirdParty.legalName}
                      </div>
                      {thirdParty.tradeName && (
                        <div className='text-xs text-muted-foreground'>
                          {thirdParty.legalName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getTypeLabel(thirdParty.type)}</TableCell>
                    <TableCell>
                      <div>{thirdParty.taxId.value}</div>
                      <div className='text-xs text-muted-foreground'>
                        {getDocumentTypeLabel(thirdParty.taxId.type)}
                      </div>
                    </TableCell>
                    <TableCell className='max-w-72 whitespace-normal break-words text-sm leading-6 text-muted-foreground'>
                      <div className='flex max-w-72 flex-wrap gap-1.5'>
                        {getRelationshipLabels(thirdParty.relationshipTypes).map(
                          (relationship) => (
                            <span
                              key={relationship}
                              className='rounded-full border border-border bg-background px-2 py-0.5 text-xs leading-5 text-muted-foreground'
                            >
                              {relationship}
                            </span>
                          ),
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          thirdParty.status === ThirdPartyStatus.Active
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {thirdParty.status === ThirdPartyStatus.Active
                          ? 'Ativo'
                          : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className='w-44 text-center align-middle'>
                      <div className='flex items-center justify-center gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon-sm'
                          className='rounded-full'
                          aria-label={`Editar ${thirdParty.tradeName ?? thirdParty.legalName}`}
                          onClick={() => setSelectedEditThirdParty(thirdParty)}
                        >
                          <Icon name='pencil' />
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='rounded-full'
                          onClick={() =>
                            setSelectedAction({
                              kind:
                                thirdParty.status === ThirdPartyStatus.Active
                                  ? 'deactivate'
                                  : 'reactivate',
                              thirdParty,
                            })
                          }
                        >
                          {thirdParty.status === ThirdPartyStatus.Active
                            ? 'Inativar'
                            : 'Reativar'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
      <AlertDialog
        open={Boolean(selectedAction)}
        onOpenChange={handleActionDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAction?.kind === 'deactivate'
                ? 'Inativar terceiro?'
                : 'Reativar terceiro?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAction?.kind === 'deactivate'
                ? `As permissões de ${selectedAction.thirdParty.tradeName ?? selectedAction.thirdParty.legalName} serão revogadas automaticamente.`
                : `O acesso de ${selectedAction?.thirdParty.tradeName ?? selectedAction?.thirdParty.legalName} poderá ser concedido novamente.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {updateThirdPartyStatusError && (
            <p role='alert' className='text-sm text-destructive'>
              Não foi possível atualizar o status do terceiro.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              className='!rounded-full'
              disabled={isUpdatingThirdPartyStatus}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className='!rounded-full'
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmAction()
              }}
              disabled={isUpdatingThirdPartyStatus}
            >
              {selectedAction?.kind === 'deactivate' ? 'Inativar' : 'Reativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ThirdPartyEditDialog
        open={Boolean(selectedEditThirdParty)}
        thirdParty={selectedEditThirdParty}
        onOpenChange={(open) => {
          if (!open) setSelectedEditThirdParty(undefined)
        }}
      />
    </main>
  )
}
