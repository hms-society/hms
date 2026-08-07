import { Card } from '@/ui/shadcn/card'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { PageTitle } from '@/ui/shared/widgets/components/page-title'
import { useMeusCasos } from './use-meus-casos'
import { CaseSection } from './widgets/case-section'

export const MeusCasos = () => {
  const { clientName, clientIntakes, isLoading, error } = useMeusCasos()
  const hours = new Date().getHours()
  const greeting = hours < 12 ? 'Bom dia' : hours < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className='flex flex-col gap-8 w-full max-w-none flex-1 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Header Banner & Cases Card */}
      <Card className='flex flex-col p-8 gap-8 bg-card border border-border/60 shadow-sm relative overflow-hidden w-full flex-1'>
        <div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none' />

        {/* Banner Top Row */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6 '>
          <div className='flex flex-col gap-2'>
            <PageTitle className='text-3xl md:text-4xl lg:mt-5 font-semibold dark:text-primary'>
              Olá, {clientName}! {greeting}!
            </PageTitle>
            <p className='text-muted-foreground text-md md:text-lg'>
              Acompanhe o andamento das suas solicitações ou inicie um novo atendimento.
            </p>
          </div>
          <Button
            variant='default'
            size='lg'
            className='h-14 px-6 text-base font-medium gap-2 shrink-0 group'
          >
            <Icon
              name='plus'
              className='size-5 transition-transform group-hover:rotate-90 duration-200'
            />
            Novo Caso
          </Button>
        </div>

        {/* Cases Section */}
        <div className='z-10 w-full flex-1 flex flex-col'>
          <CaseSection
            isLoading={isLoading}
            error={error}
            clientIntakes={clientIntakes}
          />
        </div>
      </Card>
    </div>
  )
}
