import { useParams, useSearch } from '@tanstack/react-router'

import { useDocumentFileQuery } from '@/ui/document-engine/hooks/use-document-file-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export function useDocumentViewer() {
  const { fileId } = useParams({ from: '/lotes-documentos/$fileId' })
  const { fromCaseId } = useSearch({ from: '/lotes-documentos/$fileId' })
  const { navigateTo } = useNavigation()

  const { file, isLoadingFile, isErrorFile } = useDocumentFileQuery(fileId)

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes'

    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const index = Math.floor(Math.log(bytes) / Math.log(1024))

    return `${parseFloat((bytes / 1024 ** index).toFixed(2))} ${sizes[index]}`
  }

  function handleBack() {
    if (fromCaseId) {
      void navigateTo('lawyerCaseDetails', { params: { caseId: fromCaseId } })
      return
    }

    void navigateTo('documentInbox')
  }

  const backLabel = fromCaseId ? 'Voltar para o caso' : 'Voltar aos documentos'
  const format = file?.mimeType.split('/')[1]?.toUpperCase() || 'ARQUIVO'
  const formattedDate = file
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(file.createdAt))
    : null
  const formattedFileSize = file ? formatBytes(file.sizeBytes) : '0 Bytes'

  return {
    file,
    fileId,
    isLoadingFile,
    isErrorFile,
    format,
    formattedDate,
    formattedFileSize,
    backLabel,
    handleBack,
  }
}
