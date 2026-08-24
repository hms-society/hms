import { Card } from '@/ui/shadcn/card'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useMyCasesTab } from './use-my-cases-tab'
import { CaseSection } from './case-section'

export const MyCasesTab = () => {
  const { clientName, clientIntakes, error, greeting, isLoading } = useMyCasesTab()

  return (
    <div className='flex flex-col gap-8 w-full max-w-none flex-1 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <Card className='flex flex-col p-8 gap-8 bg-card border border-border/60 shadow-sm relative overflow-hidden w-full flex-1'>
        <div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none' />

        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6 '>
          <div className='flex flex-col gap-2'>
            <h1 className='text-3xl md:text-4xl  lg:mt-5 font-semibold font-serif text-brand dark:text-primary'>
              Olá, {clientName}! {greeting}!
            </h1>
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
