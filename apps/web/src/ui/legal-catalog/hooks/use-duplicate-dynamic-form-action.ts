import type { DuplicateDynamicFormInput } from '@hms/validation/legal-catalog'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import type { FindDynamicFormNameConflictResult } from '@hms/core/legal-catalog/domain/structures'
import { AppError } from '@hms/core/shared/domain/errors'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY } from './use-dynamic-forms-administration-query'

export const useDuplicateDynamicFormAction = () => {
  const { legalCatalogService } = useRestContext()
  const queryClient = useQueryClient()
  const [conflict, setConflict] = useState<FindDynamicFormNameConflictResult | null>(null)
  const mutation = useMutation({
    mutationFn: async ({
      dynamicFormId,
      input,
    }: {
      dynamicFormId: string
      input: DuplicateDynamicFormInput
    }) => {
      const response = await legalCatalogService.duplicateDynamicForm(
        dynamicFormId,
        input,
      )
      if (response.isFailure) {
        const metadata = getFailureMetadata(response)
        if (
          response.statusCode === HTTP_STATUS_CODE.conflict &&
          typeof metadata?.existingDynamicFormId === 'string'
        ) {
          const error = new AppError(
            'Já existe um formulário com este nome.',
          ) as AppError & {
            existingDynamicFormId: string
          }
          error.existingDynamicFormId = metadata.existingDynamicFormId
          throw error
        }
        response.throwError()
      }
      return response.body
    },
    onMutate: () => setConflict(null),
    onError: (error) => {
      if (
        error instanceof AppError &&
        typeof (error as AppError & { existingDynamicFormId?: unknown })
          .existingDynamicFormId === 'string'
      ) {
        setConflict({
          conflict: true,
          existingDynamicFormId: (error as AppError & { existingDynamicFormId: string })
            .existingDynamicFormId,
        })
      }
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY,
      })
      return response
    },
  })

  async function duplicateDynamicForm(
    dynamicFormId: string,
    input: DuplicateDynamicFormInput,
  ) {
    return mutation.mutateAsync({ dynamicFormId, input })
  }

  return {
    duplicateDynamicForm,
    conflict,
    error: mutation.error,
    isPending: mutation.isPending,
  }
}

function getFailureMetadata(response: unknown) {
  const body = (response as { failureBody?: unknown }).failureBody
  if (!body || typeof body !== 'object') return null
  const metadata = (body as { metadata?: unknown }).metadata
  return metadata && typeof metadata === 'object'
    ? (metadata as { existingDynamicFormId?: unknown })
    : null
}
