import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { DynamicFormSaveBarProps } from './types'
import { useDynamicFormSaveBar } from './use-dynamic-form-save-bar'
export function DynamicFormSaveBar(props: DynamicFormSaveBarProps) {
  const controller = useDynamicFormSaveBar(props)
  return (
    <section
      className='sticky top-2 z-20 flex min-h-[70px] flex-col items-stretch justify-between gap-3 rounded-lg border border-border bg-card px-5 py-3 shadow-2xs sm:flex-row sm:items-center'
      aria-label='Ações do formulário'
    >
      <p
        aria-live='polite'
        className={
          props.state.kind === 'failure'
            ? 'flex items-center gap-2 text-sm text-destructive'
            : props.state.kind === 'dirty'
              ? 'flex items-center gap-2 text-sm text-[var(--badge-attention-foreground)]'
              : 'flex items-center gap-2 text-sm text-muted-foreground'
        }
      >
        <Icon
          name={
            props.state.kind === 'failure' || props.state.kind === 'dirty'
              ? 'alert-circle'
              : props.state.kind === 'saving'
                ? 'refresh-cw'
                : 'check-circle-2'
          }
          className={props.state.kind === 'saving' ? 'animate-spin' : undefined}
          aria-hidden='true'
        />
        {controller.message}
      </p>
      <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
        {props.state.kind === 'failure' ? (
          <Button
            type='button'
            className='w-full sm:w-auto'
            onClick={props.onRetry}
            disabled={controller.isSaving}
          >
            <Icon name='refresh-cw' /> Tentar novamente
          </Button>
        ) : (
          <Button
            type='button'
            className='w-full sm:w-auto'
            onClick={props.onSave}
            disabled={!controller.canSave || controller.isSaving}
          >
            <Icon name='check' /> {controller.isSaving ? 'Salvando…' : 'Salvar modelo'}
          </Button>
        )}
        <Button
          type='button'
          variant='destructive'
          className='w-full sm:w-auto'
          disabled={!props.canDelete || controller.isSaving}
          onClick={props.onDelete}
        >
          <Icon name='trash-2' /> Excluir formulário
        </Button>
      </div>
    </section>
  )
}
