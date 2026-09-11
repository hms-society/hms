import { useState } from 'react'
import type {
  DocumentBatch,
  DocumentBatchFile,
} from '@hms/core/document-engine/domain/entities'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'

import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type DocumentBatchCardProps = {
  batch: DocumentBatch
}

export type DocumentFileStatusView = {
  label: string
  variant: 'success' | 'waiting' | 'attention' | 'info' | 'destructive' | 'secondary'
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

  function getFileStatus(file: DocumentBatchFile): DocumentFileStatusView {
    switch (file.status) {
      case DocumentValidationStatus.Processing:
        return { label: 'Em processamento', variant: 'attention' }
      case DocumentValidationStatus.AwaitingValidation:
        return { label: 'Aguardando validação', variant: 'info' }
      case DocumentValidationStatus.Valid:
        return { label: 'Validado', variant: 'success' }
      case DocumentValidationStatus.NotLinked:
        return { label: 'Não vinculado', variant: 'waiting' }
      case DocumentValidationStatus.Illegible:
        return { label: 'Ilegível', variant: 'destructive' }
      case DocumentValidationStatus.Incomplete:
        return { label: 'Incompleto', variant: 'attention' }
      case DocumentValidationStatus.Duplicate:
        return { label: 'Duplicado', variant: 'secondary' }
      case DocumentValidationStatus.NotCorresponding:
        return { label: 'Não correspondente', variant: 'destructive' }
      case DocumentValidationStatus.ProcessingFailure:
        return { label: 'Falha no processamento', variant: 'destructive' }
      case DocumentValidationStatus.ResendRequested:
        return { label: 'Reenvio solicitado', variant: 'attention' }
      default:
        return { label: 'Recebido', variant: 'secondary' }
    }
  }

  return { handleToggleExpanded, handleViewFile, isExpanded, getFileStatus }
}
