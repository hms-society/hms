import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { useInvitationAccessStep } from './use-invitation-access-step'

import type { InvitationAccessStepProps } from './use-invitation-access-step'

export type { InvitationAccessStepProps } from './use-invitation-access-step'

export const InvitationAccessStep = (props: InvitationAccessStepProps) => {
  const { handleContinue, isPending } = useInvitationAccessStep(props)
  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-lg border border-border shadow-sm'>
        <CardHeader>
          <h1 className='font-serif text-3xl'>Documento para assinatura</h1>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <p>Você recebeu um documento para revisar e assinar com segurança.</p>
          <Button disabled={isPending} onClick={handleContinue}>
            Continuar
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
