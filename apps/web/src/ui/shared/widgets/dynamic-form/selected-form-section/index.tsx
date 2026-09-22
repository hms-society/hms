import { CollapsibleCard } from '@/ui/shared/widgets/components/collapsible-card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DynamicFormFieldsSection } from '../dynamic-form-fields'
import { DynamicFormSelector } from '../dynamic-form-selector'
import type { SelectedFormSectionProps } from './types'
import { useSelectedFormSection } from './use-selected-form-section'

export const SelectedFormSection = (props: SelectedFormSectionProps) => {
  const {
    selectedFormName,
    legalArea,
    legalTheme,
    fields,
    answers,
    errors,
    onChange,
    onOpenSelectModal,
    isReadOnly = false,
  } = useSelectedFormSection(props)

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
      <DynamicFormSelector
        selectedFormName={selectedFormName}
        legalArea={legalArea}
        legalTheme={legalTheme}
        onOpenSelectModal={onOpenSelectModal}
        isReadOnly={isReadOnly}
      />

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

export type { SelectedFormSectionProps } from './types'
