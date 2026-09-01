import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { DynamicFormAnswerValue } from '@hms/core/shared/domain'

import { useFormalizationQuery } from '@/ui/formalization/hooks/use-formalization-query'
import { useSaveFormalizationContractFormAction } from '@/ui/formalization/hooks/use-save-formalization-contract-form-action'
import { useFormalizationDocumentProduction } from '@/ui/formalization/hooks/use-formalization-document-production'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { formalizationQueryKeys } from '@/ui/formalization/hooks/formalization-query-keys'

export function useFormalizationPage(formalizationId: string) {
  const query = useFormalizationQuery(formalizationId)
  const actions = useSaveFormalizationContractFormAction(formalizationId)
  const { formalizationService } = useRestContext()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, DynamicFormAnswerValue>>({})
  const [dialog, setDialog] = useState<
    'close' | 'reopen' | 'confirm' | 'without-contract' | null
  >(null)
  const [isFormSelectionOpen, setIsFormSelectionOpen] = useState(false)

  const formalization = query.data?.formalization
  const documentProduction = useFormalizationDocumentProduction(
    formalizationId,
    formalization?.contractFormState === 'closed',
  )
  const initialAnswers = useMemo(
    () =>
      Object.fromEntries(
        (formalization?.contractFormAnswers ?? []).map((answer) => [
          answer.fieldId,
          answer.value,
        ]),
      ),
    [formalization?.contractFormAnswers],
  )

  function setAnswer(fieldId: string, value: DynamicFormAnswerValue) {
    setAnswers((current) => ({ ...current, [fieldId]: value }))
  }

  function replaceForm(dynamicFormId: string) {
    if (!formalization) return
    setAnswers({})
    actions.replaceForm.mutate({
      expectedVersion: formalization.version,
      dynamicFormId,
    })
  }

  const effectiveAnswers = Object.keys(answers).length > 0 ? answers : initialAnswers
  const answerList = Object.entries(effectiveAnswers).map(([fieldId, value]) => ({
    fieldId,
    value,
  }))

  const closeWithoutContract = useMutation({
    mutationFn: async (input: {
      reason: Parameters<typeof formalizationService.closeWithoutContract>[1]['reason']
      notes?: string
    }) => {
      const intakeVersion = query.data?.intake.version
      if (!formalization || intakeVersion === undefined) {
        throw new Error('Formalização indisponível.')
      }
      const response = await formalizationService.closeWithoutContract(formalizationId, {
        expectedVersion: formalization.version,
        expectedIntakeVersion: intakeVersion,
        reason: input.reason,
        notes: input.notes,
      })
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => {
      void queryClient
        .invalidateQueries({
          queryKey: formalizationQueryKeys.detail(formalizationId),
        })
        .catch(() => undefined)
    },
  })

  return {
    query,
    actions,
    dialog,
    setDialog,
    formalization,
    effectiveAnswers,
    answerList,
    setAnswer,
    documentProduction,
    closeWithoutContract,
    isFormSelectionOpen,
    setIsFormSelectionOpen,
    replaceForm,
  }
}
