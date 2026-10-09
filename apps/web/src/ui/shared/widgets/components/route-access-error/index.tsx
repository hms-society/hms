import { Button } from '@/ui/shadcn/button'
import { useRouteAccessError } from './use-route-access-error'

export const RouteAccessError = () => {
  const { handleRetry } = useRouteAccessError()

  return (
    <main className='mx-auto flex min-h-60 w-full max-w-xl flex-col items-center justify-center gap-3 px-4 text-center'>
      <h1 className='font-serif text-xl font-semibold text-foreground'>
        Não foi possível verificar seu acesso
      </h1>
      <p className='text-sm text-muted-foreground'>
        Nenhum conteúdo protegido foi carregado. Tente novamente.
      </p>
      <Button
        type='button'
        variant='outline'
        className='rounded-full'
        onClick={handleRetry}
      >
        Tentar novamente
      </Button>
    </main>
  )
}
