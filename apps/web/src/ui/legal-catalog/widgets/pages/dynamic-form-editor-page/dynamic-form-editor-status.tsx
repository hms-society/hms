import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import type { DynamicFormEditorPageController } from './use-dynamic-form-editor-page'
import type { DynamicFormEditorPageProps } from './types'

export type DynamicFormEditorStatusKind = 'invalid-id' | 'loading' | 'not-found' | 'error'

export function getDynamicFormEditorStatus(
  props: DynamicFormEditorPageProps,
  controller: DynamicFormEditorPageController,
): DynamicFormEditorStatusKind | null {
  if (props.mode === 'edit' && props.isValidId === false) return 'invalid-id'
  if (controller.isLoading) return 'loading'
  if (controller.isNotFound) return 'not-found'
  if (props.mode === 'edit' && controller.detailQuery.isError) return 'error'
  return null
}

export function DynamicFormEditorStatus({
  status,
  onRetry,
}: {
  status: DynamicFormEditorStatusKind
  onRetry: () => void
}) {
  if (status === 'loading')
    return (
      <main className='flex w-full flex-col gap-6 p-4 sm:p-8'>
        <Card>
          <CardContent className='flex items-center gap-3 p-8'>
            <Icon name='refresh-cw' className='animate-spin' /> Carregando formulário…
          </CardContent>
        </Card>
      </main>
    )

  const title = status === 'not-found' ? 'Formulário não encontrado' : 'Editar formulário'
  const message =
    status === 'invalid-id'
      ? 'O identificador do formulário é inválido.'
      : status === 'not-found'
        ? 'Não foi possível encontrar este formulário.'
        : 'Não foi possível carregar este formulário.'

  return (
    <main className='flex w-full flex-col gap-6 p-4 sm:p-8'>
      <Card>
        <CardHeader>
          <h1 className='font-serif text-3xl font-semibold text-brand'>{title}</h1>
          <p className='text-muted-foreground'>{message}</p>
        </CardHeader>
        <CardContent>
          {status === 'error' ? (
            <Button variant='outline' onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : null}
          {status === 'error' ? (
            <div className='mt-4'>
              <Anchor route='dynamicForms'>Voltar para formulários</Anchor>
            </div>
          ) : (
            <Anchor route='dynamicForms'>Voltar para formulários</Anchor>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
