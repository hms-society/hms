import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DynamicFormAnswer } from '@hms/core/shared/domain/structures'
import type { FormalizationDetails } from '@hms/core/formalization/domain/entities'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { getFormalizationQueryKey } from './use-formalization-query'

type MutationError = Error & { statusCode?: number }

function getMutationError(response: {
  readonly statusCode: number
  readonly throwError: () => never
}): never {
  try {
    response.throwError()
  } catch (error) {
    if (error instanceof Error) {
      Object.assign(error as MutationError, { statusCode: response.statusCode })
    }

    throw error
  }
}

export function useSaveFormalizationContractFormAction(formalizationId: string) {
  const { formalizationService } = useRestContext()
  const queryClient = useQueryClient()

  const saveDraft = useMutation({
    mutationFn: async (input: {
      expectedVersion: number
      answers: readonly DynamicFormAnswer[]
    }) => {
      const response = await formalizationService.saveContractFormDraft(
        formalizationId,
        input,
      )
      if (response.isFailure) getMutationError(response)
      return response
    },
    onSuccess: (response) => {
      if (response.isSuccessful) {
        queryClient.setQueryData(
          getFormalizationQueryKey(formalizationId),
          (current: FormalizationDetails | undefined) =>
            current ? { ...current, formalization: response.body } : current,
        )
      }
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: getFormalizationQueryKey(formalizationId),
      })
    },
  })

  const closeForm = useMutation({
    mutationFn: async (input: {
      expectedVersion: number
      answers: readonly DynamicFormAnswer[]
    }) => {
      const response = await formalizationService.closeContractForm(
        formalizationId,
        input,
      )
      if (response.isFailure) getMutationError(response)
      return response
    },
    onSuccess: (response) => {
      if (response.isSuccessful) {
        queryClient.setQueryData(
          getFormalizationQueryKey(formalizationId),
          (current: FormalizationDetails | undefined) =>
            current ? { ...current, formalization: response.body } : current,
        )
      }
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: getFormalizationQueryKey(formalizationId),
      })
    },
  })

  const reopenForm = useMutation({
    mutationFn: async (expectedVersion: number) => {
      const response = await formalizationService.reopenContractForm(
        formalizationId,
        expectedVersion,
      )
      if (response.isFailure) getMutationError(response)
      return response
    },
    onSuccess: (response) => {
      if (response.isSuccessful) {
        queryClient.setQueryData(
          getFormalizationQueryKey(formalizationId),
          (current: FormalizationDetails | undefined) =>
            current ? { ...current, formalization: response.body } : current,
        )
      }
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: getFormalizationQueryKey(formalizationId),
      })
    },
  })

  const replaceForm = useMutation({
    mutationFn: async (input: { expectedVersion: number; dynamicFormId: string }) => {
      const response = await formalizationService.replaceContractForm(
        formalizationId,
        input,
      )
      if (response.isFailure) getMutationError(response)
      return response
    },
    onSuccess: (response) => {
      if (response.isSuccessful) {
        queryClient.setQueryData(
          getFormalizationQueryKey(formalizationId),
          (current: FormalizationDetails | undefined) =>
            current ? { ...current, formalization: response.body } : current,
        )
      }
    },
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: getFormalizationQueryKey(formalizationId),
      })
    },
  })

  return { saveDraft, closeForm, reopenForm, replaceForm }
}
