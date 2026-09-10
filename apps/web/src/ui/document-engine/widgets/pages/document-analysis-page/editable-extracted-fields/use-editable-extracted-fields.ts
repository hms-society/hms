import { useEffect } from 'react'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import type { DocumentReviewFormData } from '@hms/validation/document-engine'

export type EditableExtractedFieldsProps = {
  form: UseFormReturn<DocumentReviewFormData>
  title: string
}

export function useEditableExtractedFields({
  form,
}: EditableExtractedFieldsProps) {
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'extractedFields',
  })

  useEffect(() => {
    if (fields.length > 0) return

    const currentFields = form.getValues('extractedFields') ?? []

    replace(currentFields)
  }, [fields.length, form, replace])

  return { fields }
}
