import { useState } from 'react'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type DocumentBatchCardProps = {
  batch: any
}

export function useDocumentBatchCard() {
  const { navigateTo } = useNavigation()
  const [isExpanded, setIsExpanded] = useState(false)

  function handleToggleExpanded() {
    setIsExpanded((current) => !current)
  }

  function handleViewFile(fileId: string) {
    void navigateTo('documentAnalysis', { params: { fileId } })
  }

  return { handleToggleExpanded, handleViewFile, isExpanded }
}
