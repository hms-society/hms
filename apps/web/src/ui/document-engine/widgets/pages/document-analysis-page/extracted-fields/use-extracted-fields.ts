import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'
import type { IconName } from '@/ui/shared/widgets/components/icon'

export type ExtractedFieldsProps = {
  fields: DocumentValidationDocument['extractedFields']
  title: string
}

export function useExtractedFields(fields: ExtractedFieldsProps['fields']) {
  const extractedCount = fields.filter((field) => !field.isMissing && field.value).length

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

  return { extractedCount, getFieldIcon }
}
