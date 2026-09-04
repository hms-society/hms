import { useState } from 'react'

export type FormalizationSendingConfigurationTab = 'summary' | 'signatories' | 'fields'

export function useFormalizationSendingConfiguration() {
  const [activeTab, setActiveTab] =
    useState<FormalizationSendingConfigurationTab>('signatories')
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isFieldsDirty, setIsFieldsDirty] = useState(false)
  const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = useState(false)
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

  return {
    activeTab,
    handleConfirmUnsavedChanges,
    handleFieldsDirtyChange,
    handleTabChange,
    handleUnsavedChangesDialogOpenChange,
    isResetDialogOpen,
    isUnsavedChangesDialogOpen,
    setIsResetDialogOpen,
  }
}
