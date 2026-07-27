import { Link } from '@tanstack/react-router'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const IntakesPage = () => {
  return (
    <AppLayout>
      <div className='mx-auto flex min-h-[65vh] w-full max-w-6xl items-center justify-center'>
        <section className='flex max-w-xl flex-col items-center text-center'>
          <span className='mb-5 flex size-12 items-center justify-center rounded-xl bg-secondary text-primary'>
            <Icon name='file-text' className='size-5' />
          </span>
          <h1 className='text-3xl font-medium'>Intakes</h1>
          <p className='mt-3 max-w-[60ch] text-sm leading-6 text-muted-foreground'>
            Registre uma nova demanda e vincule o cliente antes de definir o desfecho
            inicial.
          </p>
          <Button asChild className='mt-6 rounded-full px-5'>
            <Link to='/intakes/new'>
              Novo Intake
              <Icon name='arrow-right' />
            </Link>
          </Button>
        </section>
      </div>
    </AppLayout>
  )
}
