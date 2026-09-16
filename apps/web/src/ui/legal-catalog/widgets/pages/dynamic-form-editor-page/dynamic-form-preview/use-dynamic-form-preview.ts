import { useEffect, useState } from 'react'
import type { DynamicFormAnswerValue } from '@hms/core/shared/domain'
import type { DynamicFormPreviewProps } from './types'

export function useDynamicFormPreview({ fields }: DynamicFormPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, DynamicFormAnswerValue>>({})
  useEffect(() => {
    setAnswers((current) =>
      Object.fromEntries(
        fields.map((field) => [
          field.fieldId ?? field.clientId,
          current[field.fieldId ?? field.clientId] ?? defaultValue(field),
        ]),
      ),
    )
  }, [fields])
  return {
    answers,
    onChange: (fieldId: string, value: DynamicFormAnswerValue) =>
      setAnswers((current) => ({ ...current, [fieldId]: value })),
  }
}

function defaultValue(
  field: DynamicFormPreviewProps['fields'][number],
): DynamicFormAnswerValue {
  if (field.defaultOptionClientIds?.length)
    return field.type === 'single_selection'
      ? (field.options?.find(
          (option) => option.clientId === field.defaultOptionClientIds?.[0],
        )?.value ?? '')
      : field.defaultOptionClientIds.map(
          (id) => field.options?.find((option) => option.clientId === id)?.value ?? '',
        )
  return field.defaultValue ?? null
}
