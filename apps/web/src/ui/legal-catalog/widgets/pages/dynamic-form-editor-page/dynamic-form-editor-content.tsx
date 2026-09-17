import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { DynamicFormEditorIdentificationCard } from './dynamic-form-editor-identification-card'
import { DynamicFormEditorOverlays } from './dynamic-form-editor-overlays'
import { DynamicFormFieldList } from './dynamic-form-field-list'
import { DynamicFormPreview } from './dynamic-form-preview'
import { DynamicFormSaveBar } from './dynamic-form-save-bar'
import type { DynamicFormEditorPageController } from './use-dynamic-form-editor-page'
import type { DynamicFormEditorPageProps } from './types'

export function DynamicFormEditorContent({
  props,
  controller,
}: {
  props: DynamicFormEditorPageProps
  controller: DynamicFormEditorPageController
}) {
  const { draft } = controller
  const form = controller.detailQuery.data?.form ?? null
  const title =
    props.mode === 'create' ? 'Novo formulário' : (form?.name ?? 'Editar formulário')
  const canDelete = props.mode === 'edit' && Boolean(form)
  const validationMessage = getValidationMessage(draft)

  function openFieldByClientId(clientId: string) {
    const index = draft.fields.findIndex((field) => field.clientId === clientId)
    controller.openField(index < 0 ? 'create' : 'edit', index < 0 ? undefined : index)
  }

  return (
    <main className='flex w-full flex-col gap-4 pb-10'>
      <Button asChild variant='link' className='h-auto w-fit px-0 text-primary'>
        <Anchor route='dynamicForms'>
          <Icon name='arrow-left' className='size-4' />
          Voltar para formulários
        </Anchor>
      </Button>

      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='font-serif text-2xl font-semibold text-brand'>{title}</h1>
          <p className='text-sm text-muted-foreground'>
            Configure o formulário sugerido em consultas para uma área e seus temas
            jurídicos.
          </p>
        </div>
      </header>
      {controller.availabilityError && (
        <p role='alert' className='text-sm text-destructive'>
          Não foi possível alterar a disponibilidade.{' '}
          <button
            type='button'
            className='underline'
            onClick={() => void controller.toggleAvailability()}
          >
            Tentar novamente
          </button>
        </p>
      )}
      <DynamicFormSaveBar
        state={controller.saveState}
        canDelete={canDelete}
        onSave={() => void controller.submit()}
        onRetry={() => void controller.retrySave()}
        onDelete={controller.openDelete}
      />
      <DynamicFormEditorIdentificationCard props={props} controller={controller} />
      <DynamicFormFieldList
        fields={draft.fields}
        preview={<DynamicFormPreview fields={draft.fields} />}
        onEdit={openFieldByClientId}
        onRemove={controller.openRemoveField}
        onMove={controller.moveField}
      />
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Icon name='info' className='size-4' /> A remoção só será persistida ao salvar o
        modelo.
      </div>
      {validationMessage && controller.saveState.kind === 'dirty' && (
        <p role='alert' className='text-sm text-destructive'>
          {validationMessage}
        </p>
      )}
      <DynamicFormEditorOverlays controller={controller} />
    </main>
  )
}

function getValidationMessage(draft: DynamicFormEditorPageController['draft']) {
  if (
    draft.name.trim() &&
    draft.legalAreaId &&
    draft.legalTopicIds.length &&
    draft.fields.length
  )
    return null
  return 'Preencha nome, área, pelo menos um tema e um campo para salvar.'
}
