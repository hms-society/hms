import { useRef } from 'react'
import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import type { IconName } from '@/ui/shared/widgets/components/icon'

export type ExtractedFieldsProps = {
  fields: DocumentValidationDocument['extractedFields']
  title: string
}

export function useExtractedFields(fields: ExtractedFieldsProps['fields']) {
  const fieldKeysRef = useRef(
    new WeakMap<ExtractedFieldsProps['fields'][number], string>(),
  )
  const fieldKeyCountRef = useRef(0)
  const extractedCount = fields.filter((field) => !field.isMissing && field.value).length

  function getFieldKey(field: ExtractedFieldsProps['fields'][number]) {
    const existingKey = fieldKeysRef.current.get(field)

    if (existingKey) return existingKey

    const nextKey = `${field.label}:${field.value}:${fieldKeyCountRef.current}`

    fieldKeyCountRef.current += 1
    fieldKeysRef.current.set(field, nextKey)

    return nextKey
  }

  function getFieldIcon(label: string): IconName {
    const icons: Record<string, IconName> = {
      Titular: 'user',
      CPF: 'credit-card',
      Endereço: 'map-pin',
      CEP: 'map',
      'Data de emissão': 'calendar',
    }

    return icons[label] ?? 'file-text'
  }

  return { extractedCount, getFieldIcon, getFieldKey }
}
