import type { DynamicFormAnswerValue, DynamicFormField } from '@hms/core/shared/domain'

import { CollapsibleCard } from '@/ui/shared/widgets/components/collapsible-card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DynamicFormFieldsSection } from '../dynamic-form-fields'

export type SelectedFormSectionProps = {
  selectedFormName: string
  legalArea: string
  legalTheme: string
  fields: readonly DynamicFormField[]
  answers: Readonly<Record<string, DynamicFormAnswerValue>>
  errors: Readonly<Record<string, string>>
  onChange: (fieldId: string, value: DynamicFormAnswerValue) => void
  onOpenSelectModal: () => void
  isReadOnly?: boolean
}

export const SelectedFormSection = ({
  selectedFormName,
  legalArea,
  legalTheme,
  fields,
  answers,
  errors,
  onChange,
  onOpenSelectModal,
  isReadOnly = false,
}: SelectedFormSectionProps) => {
  return (
    <CollapsibleCard
      title={
        <div className='flex items-start gap-3'>
          <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-highlight text-primary'>
            <Icon name='clipboard-list' className='size-5' />
          </span>
          <div className='min-w-0 space-y-0.5'>
            <h2 className='text-lg font-bold text-foreground'>Ficha dinâmica</h2>
            <p className='text-sm text-muted-foreground'>
              As sugestões usam o contexto acima, mas você pode escolher qualquer ficha
              disponível.
            </p>
          </div>
        </div>
      }
      className='border-border px-6 py-6 sm:px-9 sm:py-7'
      contentClassName='space-y-6'
    >
      <div className='space-y-2'>
        <div className='flex items-center justify-between gap-4'>
          <span className='text-base font-medium text-foreground'>Ficha</span>
          <span className='text-xs text-muted-foreground'>
            Pesquise pelo nome da ficha
          </span>
        </div>
        <button
          type='button'
          onClick={onOpenSelectModal}
          disabled={isReadOnly}
          className='flex min-h-16 w-full items-center justify-between gap-4 rounded-xl border border-input bg-transparent px-3 py-2 text-left transition-colors hover:bg-muted/30 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100'
        >
          <span className='flex min-w-0 items-center gap-3'>
            <Icon name='file-text' className='size-5 shrink-0 text-primary' />
            <span className='min-w-0'>
              <span className='block truncate text-sm font-semibold text-foreground'>
                {selectedFormName}
              </span>
              <span className='mt-0.5 block truncate text-xs text-muted-foreground'>
                {legalArea} · {legalTheme}
              </span>
            </span>
          </span>
          <Icon name='chevron-down' className='size-5 shrink-0 text-muted-foreground' />
        </button>
      </div>

      {fields.length > 0 && (
        <>
          <div className='h-px w-full bg-border' />
          <div className='rounded-xl border border-border bg-card px-5 py-5 sm:px-6 sm:py-6'>
            <div className='mb-5 flex items-center justify-between gap-4'>
              <h3 className='flex items-center gap-2 text-base font-semibold text-foreground'>
                <Icon name='list-checks' className='size-5 text-primary' />
                Formulário da ficha selecionada
              </h3>
              <span className='shrink-0 rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-highlight-foreground'>
                {fields.length} {fields.length === 1 ? 'campo' : 'campos'}
              </span>
            </div>
            <DynamicFormFieldsSection
              fields={fields}
              answers={answers}
              errors={errors}
              onChange={onChange}
              isReadOnly={isReadOnly}
            />
          </div>
        </>
      )}
    </CollapsibleCard>
  )
}
