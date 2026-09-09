import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { useCollaboratorLoginStep } from './use-collaborator-login-step'

export type { CollaboratorLoginStepProps } from './use-collaborator-login-step'
import type { CollaboratorLoginStepProps } from './use-collaborator-login-step'

export const CollaboratorLoginStep = (props: CollaboratorLoginStepProps) => {
  const { description, handleContinue, isPending, loginSearch } =
    useCollaboratorLoginStep(props)
  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-lg border border-border shadow-sm'>
        <CardHeader>
          <h1 className='font-serif text-3xl'>Acesso do colaborador</h1>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <p role={props.error ? 'alert' : undefined}>{description}</p>
          <Button asChild disabled={isPending} onClick={handleContinue}>
            <Anchor route='login' search={loginSearch}>
              {props.error ? 'Trocar de conta' : 'Entrar'}
            </Anchor>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
