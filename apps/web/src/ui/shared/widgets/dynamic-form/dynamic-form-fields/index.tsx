import type { DynamicFormAnswerValue, DynamicFormField } from '@hms/core/shared/domain'

import { Checkbox } from '@/ui/shadcn/checkbox'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Textarea } from '@/ui/shadcn/textarea'

export type DynamicFormFieldsSectionProps = {
  fields: readonly DynamicFormField[]
  answers: Readonly<Record<string, DynamicFormAnswerValue>>
  errors: Readonly<Record<string, string>>
  onChange: (fieldId: string, value: DynamicFormAnswerValue) => void
  isReadOnly?: boolean
}

export const DynamicFormFieldsSection = ({
  fields,
  answers,
  errors,
  onChange,
  isReadOnly = false,
}: DynamicFormFieldsSectionProps) => {
  if (fields.length === 0) return null

  return (
    <div className='grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2'>
      {fields.map((field) => {
        const error = errors[`field:${field.id}`]
        const value = answers[field.id]
        const fieldId = `dynamic-field-${field.id}`
        const errorId = `${fieldId}-error`
        const required = isRequired(field, fields, answers)

        return (
          <div key={field.id} className='space-y-2'>
            {field.type === 'boolean' ? (
              <label
                htmlFor={fieldId}
                className='flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted/30'
              >
                <Checkbox
                  id={fieldId}
                  checked={value === true}
                  onCheckedChange={(checked) => onChange(field.id, checked === true)}
                  disabled={isReadOnly}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                />
                <span>
                  {field.label}
                  {required && <span className='ml-1 text-destructive'>*</span>}
                </span>
              </label>
            ) : (
              <label htmlFor={fieldId} className='text-sm font-medium text-foreground'>
                {field.label}
                {required && <span className='ml-1 text-destructive'>*</span>}
              </label>
            )}

            {field.description && (
              <p className='text-xs text-muted-foreground'>{field.description}</p>
            )}

            {field.type === 'short_text' && (
              <Input
                id={fieldId}
                value={typeof value === 'string' ? value : ''}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                readOnly={isReadOnly}
                onChange={(event) => onChange(field.id, event.target.value)}
                className='h-11 rounded-xl text-sm'
              />
            )}

            {field.type === 'long_text' && (
              <Textarea
                id={fieldId}
                value={typeof value === 'string' ? value : ''}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                readOnly={isReadOnly}
                onChange={(event) => onChange(field.id, event.target.value)}
                className='min-h-24 rounded-xl text-sm'
              />
            )}

            {field.type === 'date' && (
              <Input
                id={fieldId}
                type='date'
                value={typeof value === 'string' ? value : ''}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                readOnly={isReadOnly}
                onChange={(event) => onChange(field.id, event.target.value)}
                className='h-11 rounded-xl text-sm'
              />
            )}

            {(field.type === 'integer' ||
              field.type === 'currency' ||
              field.type === 'percentage') && (
              <Input
                id={fieldId}
                type='number'
                inputMode='decimal'
                min={field.validation?.min}
                max={field.validation?.max}
                step={field.type === 'integer' ? 1 : 'any'}
                value={typeof value === 'number' ? String(value) : ''}
                placeholder={field.placeholder}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                readOnly={isReadOnly}
                onChange={(event) => {
                  const next = event.target.value
                  onChange(field.id, next === '' ? null : Number(next))
                }}
                className='h-11 rounded-xl text-sm'
              />
            )}

            {field.type === 'single_selection' && (
              <Select
                value={typeof value === 'string' ? value : ''}
                onValueChange={(next) => onChange(field.id, next)}
                disabled={isReadOnly}
              >
                <SelectTrigger
                  id={fieldId}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  className='w-full rounded-xl'
                >
                  <SelectValue placeholder={field.placeholder ?? 'Selecione uma opção'} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'multiple_selection' && (
              <div
                className='space-y-1.5 rounded-xl border border-input bg-transparent p-2.5'
                aria-describedby={error ? errorId : undefined}
              >
                {field.options?.map((option) => {
                  const selectedValues = Array.isArray(value) ? value : []
                  const isSelected = selectedValues.includes(option.value)
                  const optionId = `${fieldId}-${option.value}`
                  return (
                    <label
                      key={option.value}
                      htmlFor={optionId}
                      className={`group flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm transition-colors focus-within:ring-3 focus-within:ring-ring/20 ${
                        isSelected
                          ? 'border-primary/25 bg-highlight text-foreground'
                          : 'border-transparent bg-transparent text-foreground hover:border-border hover:bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        id={optionId}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          onChange(
                            field.id,
                            checked === true
                              ? [...selectedValues, option.value]
                              : selectedValues.filter((item) => item !== option.value),
                          )
                        }
                        disabled={isReadOnly}
                        className='size-4 rounded-[5px]'
                      />
                      <span className='leading-5'>{option.label}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {error && (
              <p
                id={errorId}
                role='alert'
                className='text-xs font-medium text-destructive'
              >
                {error}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function isRequired(
  field: DynamicFormField,
  fields: readonly DynamicFormField[],
  answers: Readonly<Record<string, DynamicFormAnswerValue>>,
) {
  const condition = field.validation?.requiredWhen
  if (!condition) return field.required
  const dependency = fields.find((candidate) => candidate.key === condition.fieldKey)
  return dependency ? answers[dependency.id] === condition.equals : false
}
