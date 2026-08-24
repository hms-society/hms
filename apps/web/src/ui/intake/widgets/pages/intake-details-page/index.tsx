import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'

import { IntakeDetailsContent, IntakeDetailsLoading } from './intake-details-content'
import { useIntakeDetailsPage } from './use-intake-details-page'

export function IntakeDetailsPage({ intakeId }: { intakeId: string }) {
  const page = useIntakeDetailsPage(intakeId)

  if (page.intakeQuery.isLoading) return <IntakeDetailsLoading />

  if (page.intakeQuery.isError || !page.content) {
    return (
      <main className='mx-auto w-full max-w-5xl' aria-labelledby='intake-details-title'>
        <Button asChild variant='link' className='mb-6 h-auto px-0 text-brand'>
          <Anchor route='intakes'>
            <Icon name='arrow-left' /> Voltar para Intakes
          </Anchor>
        </Button>
        <section
          className='flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 text-center'
          role='alert'
        >
          <Icon name='alert-circle' className='size-6 text-destructive' />
          <h1 id='intake-details-title' className='font-serif text-2xl text-brand'>
            Não foi possível carregar o Intake
          </h1>
          <p className='text-sm text-muted-foreground'>
            Verifique o protocolo e tente novamente.
          </p>
          <Button
            type='button'
            variant='outline'
            onClick={() => void page.intakeQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  return <IntakeDetailsContent {...page.content} />
}
