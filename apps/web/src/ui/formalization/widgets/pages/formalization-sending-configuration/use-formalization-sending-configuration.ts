import { useRef, useState } from 'react'
import type { FormalizationSignatureSendingController } from '@/ui/formalization/hooks/use-formalization-signature-sending-action'

export type FormalizationSendingConfigurationTab = 'signatures' | 'fields'

type SendingActionController = Pick<
  FormalizationSignatureSendingController,
  'confirmSending' | 'isConfirming'
>

type UseFormalizationSendingConfigurationOptions = {
  canSend?: boolean
  expectedVersion?: number
  sending?: SendingActionController
}

export function useFormalizationSendingConfiguration(
  options: UseFormalizationSendingConfigurationOptions = {},
) {
  const { canSend = false, expectedVersion = 0, sending } = options
  const [activeTab, setActiveTab] =
    useState<FormalizationSendingConfigurationTab>('signatures')
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isFieldsDirty, setIsFieldsDirty] = useState(false)
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const confirmationKeyRef = useRef<string | undefined>(undefined)
  const [pendingTab, setPendingTab] =
    useState<FormalizationSendingConfigurationTab | null>(null)

  function handleTabChange(tab: FormalizationSendingConfigurationTab) {
    if (tab === activeTab) return
    if (activeTab === 'fields' && isFieldsDirty) {
      setPendingTab(tab)
      setIsUnsavedChangesDialogOpen(true)
      return
    }
    setActiveTab(tab)
  }

  function handleUnsavedChangesDialogOpenChange(open: boolean) {
    setIsUnsavedChangesDialogOpen(open)
    if (!open) setPendingTab(null)
  }

  function handleConfirmUnsavedChanges() {
    if (!pendingTab) return
    setActiveTab(pendingTab)
    setPendingTab(null)
    setIsUnsavedChangesDialogOpen(false)
  }

  function handleFieldsDirtyChange(dirty: boolean) {
    setIsFieldsDirty(dirty)
  }

  function getConfirmationKey() {
    confirmationKeyRef.current ??= crypto.randomUUID()
    return confirmationKeyRef.current
  }

  async function handleSend() {
    if (!canSend || !sending || sending.isConfirming) return

    await sending.confirmSending({
      expectedVersion,
      confirmationKey: getConfirmationKey(),
    })
    confirmationKeyRef.current = undefined
    setIsSendDialogOpen(false)
  }

  return {
    activeTab,
    handleConfirmUnsavedChanges,
    handleFieldsDirtyChange,
    handleSend,
    handleTabChange,
    handleUnsavedChangesDialogOpenChange,
    isResetDialogOpen,
    isSendDialogOpen,
    isUnsavedChangesDialogOpen,
    setIsResetDialogOpen,
    setIsSendDialogOpen,
  }
}
