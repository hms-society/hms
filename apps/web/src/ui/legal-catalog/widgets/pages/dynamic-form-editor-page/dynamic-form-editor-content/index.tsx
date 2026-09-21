import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { DynamicFormEditorIdentificationCard } from '../dynamic-form-editor-identification-card'
import { DynamicFormEditorOverlays } from '../dynamic-form-editor-overlays'
import { DynamicFormFieldList } from '../dynamic-form-field-list'
import { DynamicFormPreview } from '../dynamic-form-preview'
import { DynamicFormSaveBar } from '../dynamic-form-save-bar'
import type { DynamicFormEditorContentProps } from './types'
import { useDynamicFormEditorContent } from './use-dynamic-form-editor-content'

export const DynamicFormEditorContent = (props: DynamicFormEditorContentProps) => {
  const { editor, draft, title, canDelete, validationMessage, openFieldByClientId } =
    useDynamicFormEditorContent(props)

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
      {editor.availabilityError && (
        <p role='alert' className='text-sm text-destructive'>
          Não foi possível alterar a disponibilidade.{' '}
          <button
            type='button'
            className='underline'
            onClick={() => void editor.toggleAvailability()}
          >
            Tentar novamente
          </button>
        </p>
      )}
      <DynamicFormSaveBar
        state={editor.saveState}
        canDelete={canDelete}
        onSave={() => void editor.submit()}
        onRetry={() => void editor.retrySave()}
        onDelete={editor.openDelete}
      />
      <DynamicFormEditorIdentificationCard props={props.props} editor={editor} />
      <DynamicFormFieldList
        fields={draft.fields}
        preview={<DynamicFormPreview fields={draft.fields} />}
        onEdit={openFieldByClientId}
        onRemove={editor.openRemoveField}
        onMove={editor.moveField}
      />
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Icon name='info' className='size-4' /> A remoção só será persistida ao salvar o
        modelo.
      </div>
      {validationMessage && editor.saveState.kind === 'dirty' && (
        <p role='alert' className='text-sm text-destructive'>
          {validationMessage}
        </p>
      )}
      <DynamicFormEditorOverlays editor={editor} />
    </main>
  )
}

export type { DynamicFormEditorContentProps } from './types'
