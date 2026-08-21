import { Card } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { Stepper } from '@/ui/shared/widgets/components/stepper'
import { useCaseDetails } from '../use-case-details'

export type MidDetailsProps = Record<string, never>

export const MidDetails = (_props: MidDetailsProps) => {
  const { steps, activeStep, pendingDocuments, isLoading, error } = useCaseDetails()

  if (isLoading) {
    return (
      <Card className='p-8 bg-card border border-border/60 shadow-sm flex flex-col gap-8'>
        <Skeleton className='h-8 w-48' />
        <div className='flex justify-between items-center w-full gap-4 py-4'>
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className='flex-1 flex flex-col items-center gap-2'>
              <Skeleton className='size-10 rounded-full' />
              <Skeleton className='h-4 w-20' />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) throw new Error('Case details not found')

  return (
    <Card className='p-8 bg-card border border-border/60 shadow-sm flex flex-col gap-8'>
      <h2 className='text-2xl font-medium font-serif text-brand dark:text-primary'>
        Jornada do Caso
      </h2>
      <Stepper steps={steps} activeStep={activeStep} orientation='horizontal' />
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/60'>
        <div className='flex flex-col gap-1'>
          <span className='text-xs uppercase tracking-wider text-muted-foreground font-semibold'>
            Próximos Passos
          </span>
          <span className='text-sm text-foreground'>
            {activeStep === 0 &&
              'Nossa equipe está avaliando seu registro inicial. Aguarde a confirmação de agendamento de consulta.'}
            {activeStep === 1 &&
              'Compareça à consulta agendada ou prepare-se para a reunião inicial para discutir sua demanda.'}
            {activeStep === 2 &&
              'Estamos analisando a viabilidade técnica da sua ação jurídica baseado em seus dados.'}
            {activeStep === 3 &&
              'Assine os contratos e procurações disponibilizados na seção abaixo.'}
            {activeStep === 4 &&
              'O processo foi formalizado! Nossos advogados darão entrada e você acompanhará os andamentos aqui.'}
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-xs uppercase tracking-wider text-muted-foreground font-semibold'>
            Pendências Solicitadas
          </span>
          <span className='text-sm text-foreground'>
            {pendingDocuments.length > 0
              ? `Você possui ${pendingDocuments.length} documento(s) pendente(s). Por favor, providencie os arquivos abaixo.`
              : 'Nenhuma pendência de documento ou ação no momento. Tudo certo!'}
          </span>
        </div>
      </div>
    </Card>
  )
}
