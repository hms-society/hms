import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DynamicFormAnswer } from '@hms/core/shared/domain/structures'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { formalizationQueryKeys } from './formalization-query-keys'

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
      if (response.isFailure) response.throwError()
      return response
    },
    onSuccess: (response) => {
      if (response.isSuccessful) {
        queryClient.setQueryData(
          formalizationQueryKeys.detail(formalizationId),
          (current: any) =>
            current ? { ...current, formalization: response.body } : current,
        )
      }
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
      if (response.isFailure) response.throwError()
      return response
    },
    onSuccess: (response) => {
      if (response.isSuccessful) {
        queryClient.setQueryData(
          formalizationQueryKeys.detail(formalizationId),
          (current: any) =>
            current ? { ...current, formalization: response.body } : current,
        )
      }
    },
  })

  const reopenForm = useMutation({
    mutationFn: async (expectedVersion: number) => {
      const response = await formalizationService.reopenContractForm(
        formalizationId,
        expectedVersion,
      )
      if (response.isFailure) response.throwError()
      return response
    },
    onSuccess: (response) => {
      if (response.isSuccessful) {
        queryClient.setQueryData(
          formalizationQueryKeys.detail(formalizationId),
          (current: any) =>
            current ? { ...current, formalization: response.body } : current,
        )
      }
    },
  })

  const replaceForm = useMutation({
    mutationFn: async (input: { expectedVersion: number; dynamicFormId: string }) => {
      const response = await formalizationService.replaceContractForm(
        formalizationId,
        input,
      )
      if (response.isFailure) response.throwError()
      return response
    },
    onSuccess: (response) => {
      if (response.isSuccessful) {
        queryClient.setQueryData(
          formalizationQueryKeys.detail(formalizationId),
          (current: any) =>
            current ? { ...current, formalization: response.body } : current,
        )
      }
    },
  })

  return { saveDraft, closeForm, reopenForm, replaceForm }
}
