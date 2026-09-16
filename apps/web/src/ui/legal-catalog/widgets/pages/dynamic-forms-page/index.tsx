import { PageTitle } from '@/ui/shared/widgets/components/page-title'
import { Button } from '@/ui/shadcn/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/ui/shadcn/empty'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { AvailabilityDynamicFormDialog } from './availability-dynamic-form-dialog'
import { DeleteDynamicFormDialog } from './delete-dynamic-form-dialog'
import { DuplicateDynamicFormDialog } from './duplicate-dynamic-form-dialog'
import { DynamicFormsTable } from './dynamic-forms-table'
import { useDynamicFormsPage } from './use-dynamic-forms-page'

export const DynamicFormsPage = () => {
  const {
    data,
    formsQuery,
    searchParams,
    hasFilters,
    overlay,
    duplicateError,
    duplicateConflict,
    availabilityError,
    deleteError,
    successMessage,
    duplicateAction,
    availabilityAction,
    deleteAction,
    updateSearch,
    clearFilters,
    openDuplicate,
    openAvailability,
    openDelete,
    closeOverlay,
    handleDuplicate,
    handleAvailability,
    handleDelete,
    handleEdit,
    handleOpenNew,
  } = useDynamicFormsPage()

  return (
    <main className='mx-auto flex w-full min-w-0 flex-col gap-6'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1.5'>
          <PageTitle className='text-[1.625rem] font-bold'>
            Formulários dinâmicos
          </PageTitle>
          <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
            Administre os formulários usados nas consultas e formalizações do escritório.
          </p>
        </div>
        <Button onClick={handleOpenNew}>Novo formulário</Button>
      </header>

      <section
        aria-label='Filtros de formulários dinâmicos'
        className='grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]'
      >
        <label htmlFor='dynamic-form-search' className='space-y-1.5'>
          <span className='text-sm font-medium'>Buscar por nome</span>
          <Input
            id='dynamic-form-search'
            value={searchParams.search}
            placeholder='Buscar por nome'
            onChange={(event) => updateSearch({ search: event.target.value })}
          />
        </label>
        <label htmlFor='dynamic-form-stage' className='space-y-1.5'>
          <span className='text-sm font-medium'>Etapa</span>
          <Select
            value={searchParams.stage || 'all'}
            onValueChange={(value) =>
              updateSearch({ stage: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger id='dynamic-form-stage' aria-label='Filtrar por etapa'>
              <SelectValue placeholder='Todas' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todas</SelectItem>
              <SelectItem value='consultation'>Consulta</SelectItem>
              <SelectItem value='formalization'>Formalização</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label htmlFor='dynamic-form-status' className='space-y-1.5'>
          <span className='text-sm font-medium'>Estado</span>
          <Select
            value={searchParams.status || 'all'}
            onValueChange={(value) =>
              updateSearch({ status: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger id='dynamic-form-status' aria-label='Filtrar por estado'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              <SelectItem value='available'>Disponível</SelectItem>
              <SelectItem value='unavailable'>Indisponível</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {hasFilters && (
          <Button variant='outline' className='self-end' onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
      </section>

      {formsQuery.isPending && !data ? (
        <div role='status' aria-label='Carregando formulários' className='space-y-3'>
          {['one', 'two', 'three', 'four', 'five'].map((key) => (
            <Skeleton key={key} className='h-14 w-full' />
          ))}
        </div>
      ) : formsQuery.isError ? (
        <section
          role='alert'
          className='rounded-xl border border-destructive/30 bg-card p-8 text-center'
        >
          <p className='font-medium'>Não foi possível carregar os formulários.</p>
          <Button
            className='mt-4'
            variant='outline'
            onClick={() => void formsQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </section>
      ) : data?.items.length === 0 ? (
        <Empty className='min-h-64 border border-dashed'>
          <EmptyHeader>
            <EmptyTitle>
              {hasFilters
                ? 'Nenhum formulário encontrado'
                : 'Nenhum formulário cadastrado'}
            </EmptyTitle>
            <EmptyDescription>
              {hasFilters
                ? 'Ajuste os filtros para encontrar um formulário.'
                : 'Comece criando um formulário dinâmico.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {hasFilters ? (
              <Button variant='outline' onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : (
              <Button onClick={handleOpenNew}>Novo formulário</Button>
            )}
          </EmptyContent>
        </Empty>
      ) : (
        <DynamicFormsTable
          items={data?.items ?? []}
          page={data?.page ?? searchParams.page}
          pageSize={data?.pageSize ?? searchParams.pageSize}
          pageCount={data?.pageCount ?? 0}
          total={data?.total ?? 0}
          isPending={formsQuery.isFetching}
          onEdit={handleEdit}
          onDuplicate={openDuplicate}
          onChangeAvailability={openAvailability}
          onDelete={openDelete}
          onPageChange={(page) => updateSearch({ page })}
        />
      )}

      <div aria-live='polite' className='sr-only'>
        {successMessage ?? (formsQuery.isFetching ? 'Atualizando formulários' : '')}
      </div>

      <DuplicateDynamicFormDialog
        form={overlay.kind === 'duplicate' ? overlay.form : null}
        open={overlay.kind === 'duplicate'}
        isPending={duplicateAction.isPending}
        conflict={duplicateConflict ?? null}
        errorMessage={duplicateError}
        onOpenChange={closeOverlay}
        onConfirm={handleDuplicate}
        onOpenExisting={(dynamicFormId) => void handleEdit(dynamicFormId)}
      />
      <AvailabilityDynamicFormDialog
        form={overlay.kind === 'availability' ? overlay.form : null}
        open={overlay.kind === 'availability'}
        isMutationPending={availabilityAction.isPending}
        errorMessage={availabilityError}
        onOpenChange={closeOverlay}
        onConfirm={handleAvailability}
      />
      <DeleteDynamicFormDialog
        form={overlay.kind === 'delete' ? overlay.form : null}
        open={overlay.kind === 'delete'}
        isMutationPending={deleteAction.isPending}
        errorMessage={deleteError}
        onOpenChange={closeOverlay}
        onConfirm={handleDelete}
      />
    </main>
  )
}
