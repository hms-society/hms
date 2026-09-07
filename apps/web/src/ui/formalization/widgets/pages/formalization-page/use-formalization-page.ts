import { useMemo, useState } from 'react'
import type { DynamicFormAnswerValue } from '@hms/core/shared/domain'

import {
  useCloseFormalizationWithoutContractAction,
  type CloseFormalizationWithoutContractInput,
} from '@/ui/formalization/hooks/use-close-formalization-without-contract-action'
import { useFormalizationQuery } from '@/ui/formalization/hooks/use-formalization-query'
import { useSaveFormalizationContractFormAction } from '@/ui/formalization/hooks/use-save-formalization-contract-form-action'
import { useFormalizationDocumentProduction } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useFormalizationSignatureConfiguration } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

export function useFormalizationPage(formalizationId: string) {
  const query = useFormalizationQuery(formalizationId)
  const actions = useSaveFormalizationContractFormAction(formalizationId)
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
  const signatureConfiguration = useFormalizationSignatureConfiguration(
    formalizationId,
    documentProduction.isPackageConfirmed,
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

  const closeFormalizationWithoutContract =
    useCloseFormalizationWithoutContractAction(formalizationId)

  const closeWithoutContract = {
    ...closeFormalizationWithoutContract,
    mutate(
      input: Omit<
        CloseFormalizationWithoutContractInput,
        'expectedIntakeVersion' | 'expectedVersion'
      >,
    ) {
      const intakeVersion = query.data?.intake.version
      if (!formalization || intakeVersion === undefined) return

      closeFormalizationWithoutContract.mutate({
        ...input,
        expectedIntakeVersion: intakeVersion,
        expectedVersion: formalization.version,
      })
    },
  }

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
    signatureConfiguration,
    closeWithoutContract,
    isFormSelectionOpen,
    setIsFormSelectionOpen,
    replaceForm,
  }
}
