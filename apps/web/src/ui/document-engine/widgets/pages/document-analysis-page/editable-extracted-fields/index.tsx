import { Field, FieldError } from '@/ui/shadcn/field'
import { Input } from '@/ui/shadcn/input'
import {
  useEditableExtractedFields,
  type EditableExtractedFieldsProps,
} from './use-editable-extracted-fields'

export type { EditableExtractedFieldsProps } from './use-editable-extracted-fields'

export const EditableExtractedFields = (props: EditableExtractedFieldsProps) => {
  const { form, title } = props
  const { fields } = useEditableExtractedFields(props)

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-between gap-3'>
        <h3 className='font-sans text-sm font-semibold text-foreground'>{title}</h3>
      </div>

      <div className='flex flex-col gap-4'>
        {fields.map((field, index) => (
          <div key={field.id} className='flex flex-col gap-1.5'>
            <input type='hidden' {...form.register(`extractedFields.${index}.label`)} />
            <span className='font-sans text-xs font-medium text-foreground'>
              {field.label}
            </span>

            <Field
              data-invalid={Boolean(
                form.formState.errors.extractedFields?.[index]?.value,
              )}
            >
              <Input
                id={`extracted-field-${index}-value`}
                aria-label={`Valor de ${field.label}`}
                className='h-12 rounded-lg border-border bg-card px-4 font-sans text-sm font-medium shadow-xs'
                placeholder='Não identificado'
                {...form.register(`extractedFields.${index}.value`)}
              />
              <FieldError>
                {form.formState.errors.extractedFields?.[index]?.value?.message}
              </FieldError>
            </Field>
          </div>
        ))}
      </div>
    </div>
  )
}
