import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { useSignatureSubmittedStep } from './use-signature-submitted-step'

export type { SignatureSubmittedStepProps } from './use-signature-submitted-step'
import type { SignatureSubmittedStepProps } from './use-signature-submitted-step'

export const SignatureSubmittedStep = (props: SignatureSubmittedStepProps) => {
  const { handleClose, handleRefresh } = useSignatureSubmittedStep(props)
  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-lg border border-border shadow-sm'>
        <CardHeader>
          <h1 className='font-serif text-3xl'>Assinatura recebida</h1>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <p>Sua assinatura foi recebida e está aguardando confirmação.</p>
          <p>Referência: {props.result.hmsReference}</p>
          <div className='flex gap-2'>
            <Button onClick={handleRefresh}>Atualizar status</Button>
            <Button variant='outline' onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
