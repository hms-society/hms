import { useRef, useState } from 'react'
import type {
  ConfirmFormalizationContractingCommand,
  FormalizationContractingResult,
  FormalizationSignatureSendingStatusResponse,
} from '@hms/core/formalization/domain/structures'

export type ConfirmContractingActionProps = {
  intakeVersion: number
  status: FormalizationSignatureSendingStatusResponse | null
  isLoading: boolean
  isPending: boolean
  error: Error | null
  onConfirm: (
    input: ConfirmFormalizationContractingCommand,
  ) => Promise<FormalizationContractingResult>
}

export function useConfirmContractingAction({
  intakeVersion,
  isLoading,
  isPending,
  onConfirm,
  status,
}: ConfirmContractingActionProps) {
  const confirmationKeyRef = useRef<string | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  function getConfirmationKey() {
    confirmationKeyRef.current ??= crypto.randomUUID()
    return confirmationKeyRef.current
  }

  async function handleSubmit() {
    if (!status || isPending || !status.canConfirmContracting) return

    await onConfirm({
      confirmationKey: getConfirmationKey(),
      expectedFormalizationVersion: status.formalizationVersion,
      expectedIntakeVersion: intakeVersion,
      expectedRequestVersion: status.version,
    })
    setIsCompleted(true)
    setIsDialogOpen(false)
    confirmationKeyRef.current = undefined
  }

  const canConfirm = Boolean(status?.canConfirmContracting) && !isLoading && !isCompleted

  return {
    canConfirm,
    handleSubmit,
    isCompleted,
    isDialogOpen,
    setIsDialogOpen,
  }
}
