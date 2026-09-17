import type { DynamicFormField } from '@hms/core/shared/domain'

import { DynamicFormFieldsSection } from '@/ui/shared/widgets/dynamic-form/dynamic-form-fields'
import type { DynamicFormPreviewProps } from './types'
import { useDynamicFormPreview } from './use-dynamic-form-preview'

export function DynamicFormPreview({ fields }: DynamicFormPreviewProps) {
  const controller = useDynamicFormPreview({ fields })
  if (fields.length === 0)
    return (
      <div className='rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground'>
        Adicione campos para visualizar a ficha.
      </div>
    )
  return (
    <section aria-labelledby='preview-heading' className='space-y-4'>
      <h2 id='preview-heading' className='font-serif text-xl font-semibold'>
        Pré-visualização
      </h2>
      <div className='rounded-xl border border-border bg-card p-5'>
        <DynamicFormFieldsSection
          fields={fields.map(toDynamicFormField)}
          answers={controller.answers}
          errors={{}}
          onChange={controller.onChange}
          showDescriptions={false}
        />
      </div>
    </section>
  )
}

function toDynamicFormField(
  field: DynamicFormPreviewProps['fields'][number],
  position: number,
): DynamicFormField {
  return {
    id: field.fieldId ?? field.clientId,
    key: field.key ?? field.clientId,
    label: field.label,
    type: field.type,
    position,
    required: field.required,
    placeholder: field.placeholder,
    options: field.options?.map((option, optionPosition) => ({
      value: option.value ?? option.clientId,
      label: option.label,
      position: optionPosition,
    })),
    validation: field.validation,
  }
}
