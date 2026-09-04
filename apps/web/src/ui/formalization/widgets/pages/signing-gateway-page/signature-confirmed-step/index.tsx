import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { useSignatureConfirmedStep } from './use-signature-confirmed-step'

export type { SignatureConfirmedStepProps } from './use-signature-confirmed-step'
import type { SignatureConfirmedStepProps } from './use-signature-confirmed-step'

export const SignatureConfirmedStep = (props: SignatureConfirmedStepProps) => {
  const { handleClose } = useSignatureConfirmedStep(props)
  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-lg border border-border shadow-sm'>
        <CardHeader>
          <h1 className='font-serif text-3xl'>Assinatura confirmada</h1>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <p>Protocolo: {props.result.protocol}</p>
          <Button onClick={handleClose}>Fechar</Button>
        </CardContent>
      </Card>
    </main>
  )
}
