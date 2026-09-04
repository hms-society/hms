import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { useSigningUnavailableStep } from './use-signing-unavailable-step'

export type { SigningUnavailableStepProps } from './use-signing-unavailable-step'
import type { SigningUnavailableStepProps } from './use-signing-unavailable-step'

export const SigningUnavailableStep = (props: SigningUnavailableStepProps) => {
  const { handleRetry } = useSigningUnavailableStep(props)
  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-lg border border-border shadow-sm'>
        <CardHeader>
          <h1 className='font-serif text-3xl'>Assinatura indisponível</h1>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <p role='alert'>
            {props.error ?? 'Não foi possível concluir esta assinatura.'}
          </p>
          {props.retryAt && (
            <p>Tente novamente após {new Date(props.retryAt).toLocaleTimeString()}.</p>
          )}
          {props.onRetry && <Button onClick={handleRetry}>Tentar novamente</Button>}
        </CardContent>
      </Card>
    </main>
  )
}
