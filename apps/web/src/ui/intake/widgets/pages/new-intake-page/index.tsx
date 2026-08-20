import { FormProvider } from 'react-hook-form'

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
import { Button } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { ClientStep } from './client-step'
import { DecisionStep } from './decision-step'
import { StepDemand } from './demand-step'
import { useNewIntake } from './use-new-intake'

const STEPS = ['Demanda', 'Cliente', 'Decisão'] as const

const CLOSURE_REASON_LABELS: Record<string, string> = {
  out_of_scope: 'Fora do escopo',
  legally_unviable: 'Inviável juridicamente',
  client_withdrew: 'Cliente desistiu',
  unable_to_contact: 'Sem contato',
  referred: 'Encaminhado',
  other: 'Outro',
}

export const NewIntakePage = () => {
  const {
    currentStep,
    closureReason,
    decision,
    error,
    form,
    isClosureDialogOpen,
    isSubmitting,
    stepContent,
    handleClosureDialogChange,
    handleConfirmClosure,
    handleNext,
    handlePrevious,
    handleRequestClosure,
    handleReset,
    handleSubmit,
  } = useNewIntake()

  return (
    <FormProvider {...form}>
      <form
        className='flex w-full flex-col gap-5 pt-20 pb-12 px-4 sm:px-6'
        onSubmit={handleSubmit}
        noValidate
      >
        <Anchor
          route='intakes'
          className='inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary outline-none hover:text-brand focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50'
        >
          <Icon name='arrow-left' className='size-4' />
          {currentStep === 3 && decision === 'close' ? 'Voltar' : 'Intakes'}
        </Anchor>

        <header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='max-w-2xl'>
            <h1 className='text-[26px] font-medium text-foreground'>
              {stepContent.title}
            </h1>
            {stepContent.description && (
              <p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
                {stepContent.description}
              </p>
            )}
          </div>

          {currentStep === 3 && decision === 'close' ? (
            <Button
              type='button'
              variant='destructive'
              className='rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isSubmitting}
              onClick={handleRequestClosure}
            >
              <Icon name='door-open' />
              Encerrar atendimento
            </Button>
          ) : null}
        </header>

        <ol
          className='grid grid-cols-3 border-b border-border'
          aria-label='Etapas do novo intake'
        >
          {STEPS.map((step, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === currentStep
            const isComplete = stepNumber < currentStep

            return (
              <li
                key={step}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center justify-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition-colors sm:px-5 ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground'
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isActive
                      ? 'border-brand bg-brand text-brand-foreground'
                      : isComplete
                        ? 'border-highlight-vivid bg-highlight text-highlight-foreground'
                        : 'border-input bg-card'
                  }`}
                >
                  {isComplete ? <Icon name='check' className='size-3.5' /> : stepNumber}
                </span>
                <span className='hidden sm:inline'>{step}</span>
              </li>
            )
          })}
        </ol>

        {currentStep < 3 ? (
          <section className='rounded-xl border border-border bg-card p-4 sm:p-6'>
            {currentStep === 1 && <StepDemand />}
            {currentStep === 2 && <ClientStep />}
          </section>
        ) : (
          <DecisionStep />
        )}

        {error && (
          <p role='alert' className='text-sm text-destructive'>
            Não foi possível registrar o intake. Tente novamente.
          </p>
        )}

        <footer className='flex flex-wrap items-center justify-end gap-2 pt-4'>
          {currentStep > 1 && (
            <Button
              type='button'
              variant='brand'
              className='rounded-pill'
              size='sm'
              onClick={handlePrevious}
              disabled={isSubmitting}
            >
              <Icon name='arrow-left' />
              Anterior
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type='button'
              variant='brand'
              className='rounded-pill'
              size='sm'
              onClick={handleNext}
            >
              Próximo
              <Icon name='arrow-right' />
            </Button>
          ) : decision === 'schedule' ? (
            <>
              <Button
                type='button'
                variant='outline'
                className='rounded-pill'
                size='sm'
                onClick={handleReset}
              >
                <Icon name='x' />
                Cancelar
              </Button>
              <Button
                type='submit'
                className='rounded-pill'
                size='sm'
                disabled={isSubmitting}
              >
                <Icon name='plus' />
                {isSubmitting ? 'Criando...' : 'Criar intake'}
              </Button>
            </>
          ) : null}
        </footer>
      </form>

      <AlertDialog open={isClosureDialogOpen} onOpenChange={handleClosureDialogChange}>
        <AlertDialogContent className='max-w-[calc(100%-2rem)] gap-0 p-0 sm:max-w-[480px]'>
          <AlertDialogHeader className='relative place-items-start gap-1 p-5 pr-14 text-left'>
            <AlertDialogTitle className='font-serif text-xl font-semibold'>
              Encerrar sem contratação?
            </AlertDialogTitle>
            <AlertDialogDescription className='text-xs'>
              Confirme o encerramento definitivo deste intake.
            </AlertDialogDescription>
            <AlertDialogCancel
              variant='secondary'
              size='icon'
              className='absolute top-4 right-4 rounded-full'
              aria-label='Fechar confirmação'
            >
              <Icon name='x' />
            </AlertDialogCancel>
          </AlertDialogHeader>

          <div className='space-y-4 border-y border-border p-5'>
            <div className='flex items-center gap-2 rounded-md border border-border bg-accent px-3 py-2.5 text-xs font-semibold text-foreground'>
              <Icon name='triangle-alert' className='size-3.5 text-destructive' />O intake
              será encerrado definitivamente.
            </div>
            <div className='space-y-1.5'>
              <p className='text-xs font-semibold text-foreground'>
                Motivo do encerramento
              </p>
              <div className='flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground'>
                <Icon name='tag' className='size-3.5 text-destructive' />
                {closureReason ? CLOSURE_REASON_LABELS[closureReason] : 'Não informado'}
              </div>
            </div>
            <p className='flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5 text-xs font-semibold text-secondary-foreground'>
              <Icon name='info' className='size-3.5 text-primary' />O cliente e o
              histórico permanecerão disponíveis.
            </p>
          </div>

          <AlertDialogFooter className='m-0 rounded-none bg-card p-4'>
            <AlertDialogCancel className='rounded-pill'>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              className='rounded-pill bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={handleConfirmClosure}
            >
              <Icon name='door-open' />
              Encerrar sem contratação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  )
}
