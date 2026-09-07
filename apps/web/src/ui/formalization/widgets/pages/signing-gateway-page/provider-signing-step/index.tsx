import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { useProviderSigningStep } from './use-provider-signing-step'

export type { ProviderSigningStepProps } from './use-provider-signing-step'
import type { ProviderSigningStepProps } from './use-provider-signing-step'

export const ProviderSigningStep = (props: ProviderSigningStepProps) => {
  const { handleUnavailable, handleSubmitted } = useProviderSigningStep(props)
  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-lg border border-border shadow-sm'>
        <CardHeader>
          <h1 className='font-serif text-3xl'>{props.title}</h1>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <p>O documento está pronto para assinatura.</p>
          <Button asChild>
            <a href={props.proxyPath}>Continuar no documento</a>
          </Button>
          <Button variant='outline' onClick={handleSubmitted}>
            Já assinei
          </Button>
          <Button variant='ghost' onClick={handleUnavailable}>
            Não foi possível assinar
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
