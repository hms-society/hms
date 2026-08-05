import { Button } from '@/ui/shadcn/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/shadcn/empty'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

import { IntakeStatusTabs } from './intake-status-tabs'
import { IntakesFilters } from './intakes-filters'
import { IntakesTable } from './intakes-table'
import { IntakesTableSkeleton } from './intakes-table-skeleton'
import { useIntakesPage } from './use-intakes-page'

export const IntakesPage = () => {
  const {
    copiedIntakeId,
    hasActiveFilters,
    intakesPage,
    intakesPageError,
    isLoadingIntakes,
    isLoadingResponsibles,
    page,
    responsibles,
    responsiblesError,
    searchParams,
    totalPages,
    handleClearFilters,
    handleCopyIntakeId,
    handleRetry,
    handleRetryResponsibles,
    handleUpdateSearch,
  } = useIntakesPage()

  return (
    <main className='w-full space-y-4' aria-labelledby='intakes-page-title'>
      <header className='flex items-center justify-between gap-4'>
        <div>
          <h1
            id='intakes-page-title'
            className='font-serif text-[1.625rem] font-semibold tracking-tight text-foreground'
          >
            Intakes
          </h1>
          <p className='mt-1 text-xs text-muted-foreground'>
            Acompanhe cada demanda desde a entrada até a conversão em caso.
          </p>
        </div>
        <Button asChild size='sm' className='rounded-full px-4 text-xs'>
          <Anchor route='newIntake'>
            <Icon name='plus' /> Novo Intake
          </Anchor>
        </Button>
      </header>

      <IntakesFilters
        isLoadingResponsibles={isLoadingResponsibles}
        responsibles={responsibles}
        responsiblesError={responsiblesError}
        searchParams={searchParams}
        onClear={handleClearFilters}
        onRetryResponsibles={handleRetryResponsibles}
        onUpdate={handleUpdateSearch}
      />

      <section
        className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'
        aria-label='Lista de intakes'
      >
        <IntakeStatusTabs
          activeStatus={searchParams.status}
          counts={intakesPage?.statusCounts}
          onStatusChange={(status) => handleUpdateSearch({ status })}
        />

        {isLoadingIntakes ? (
          <IntakesTableSkeleton />
        ) : intakesPageError ? (
          <div
            className='flex min-h-72 flex-col items-center justify-center gap-3 px-6 text-center'
            role='alert'
          >
            <EmptyMedia variant='icon'>
              <Icon name='triangle-alert' />
            </EmptyMedia>
            <h2 className='font-serif text-xl text-brand'>
              Não foi possível carregar os intakes
            </h2>
            <p className='max-w-md text-sm text-muted-foreground'>
              Verifique sua conexão e tente novamente. Os filtros atuais serão
              preservados.
            </p>
            <Button type='button' variant='outline' onClick={handleRetry}>
              Tentar novamente
            </Button>
          </div>
        ) : intakesPage && intakesPage.items.length > 0 ? (
          <>
            <IntakesTable
              copiedIntakeId={copiedIntakeId}
              items={intakesPage.items}
              onCopyId={handleCopyIntakeId}
            />
            <footer className='flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between'>
              <span>
                Exibindo{' '}
                {Math.min((page - 1) * intakesPage.pageSize + 1, intakesPage.total)}–
                {Math.min(page * intakesPage.pageSize, intakesPage.total)} de{' '}
                {intakesPage.total} intakes
              </span>
              <nav aria-label='Paginação de intakes' className='flex items-center gap-1'>
                <Button
                  type='button'
                  variant='outline'
                  size='icon-sm'
                  aria-label='Página anterior'
                  disabled={page <= 1}
                  onClick={() => handleUpdateSearch({ page: page - 1 })}
                >
                  <Icon name='chevron-left' />
                </Button>
                {Array.from({ length: Math.max(totalPages, 1) }, (_, index) => {
                  const pageNumber = index + 1

                  return (
                    <Button
                      key={pageNumber}
                      type='button'
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Página ${pageNumber}`}
                      aria-current={pageNumber === page ? 'page' : undefined}
                      className={
                        pageNumber === page
                          ? 'border border-primary bg-highlight font-medium text-primary hover:bg-highlight'
                          : undefined
                      }
                      onClick={() => handleUpdateSearch({ page: pageNumber })}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
                <Button
                  type='button'
                  variant='outline'
                  size='icon-sm'
                  aria-label='Próxima página'
                  disabled={page >= totalPages}
                  onClick={() => handleUpdateSearch({ page: page + 1 })}
                >
                  <Icon name='chevron-right' />
                </Button>
              </nav>
            </footer>
          </>
        ) : (
          <Empty className='min-h-72 rounded-none border-0'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Icon name={hasActiveFilters ? 'search' : 'inbox'} />
              </EmptyMedia>
              <EmptyTitle>
                {hasActiveFilters ? 'Nenhum intake encontrado' : 'Ainda não há intakes'}
              </EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters
                  ? 'Ajuste ou limpe os filtros para tentar novamente.'
                  : 'Registre uma demanda para começar a organizar a fila operacional.'}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {hasActiveFilters ? (
                <Button type='button' variant='outline' onClick={handleClearFilters}>
                  Limpar filtros
                </Button>
              ) : (
                <Button asChild>
                  <Anchor route='newIntake'>Novo Intake</Anchor>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        )}
      </section>
    </main>
  )
}
