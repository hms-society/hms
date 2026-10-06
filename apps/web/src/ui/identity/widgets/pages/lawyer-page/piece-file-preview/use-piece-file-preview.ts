import { useQuery } from '@tanstack/react-query'
import { renderAsync } from 'docx-preview'
import { useEffect, useRef, useState } from 'react'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export type UsePieceFilePreviewProps = {
  caseId: string
  documentId: string
  versionId: string
  storagePath?: string
}

export function usePieceFilePreview({
  caseId,
  documentId,
  versionId,
  storagePath,
}: UsePieceFilePreviewProps) {
  const { caseDocumentProductionService } = useRestContext()
  const docxContainerRef = useRef<HTMLDivElement>(null)
  const [fileUrl, setFileUrl] = useState<string>()
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string>()
  const fileQuery = useQuery({
    queryKey: ['case-document-file', caseId, documentId, versionId],
    queryFn: async () => {
      const response = await caseDocumentProductionService.getDocumentFile(
        caseId,
        documentId,
        versionId,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    enabled: Boolean(caseId && documentId && versionId),
    retry: false,
  })

  useEffect(() => {
    if (!fileQuery.data) return
    const url = URL.createObjectURL(fileQuery.data)
    setFileUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [fileQuery.data])

  useEffect(() => {
    if (!fileUrl || !docxContainerRef.current) return
    const isDocxFile =
      storagePath?.toLowerCase().endsWith('.docx') ||
      fileQuery.data?.type === DOCX_MIME_TYPE
    if (!isDocxFile) return

    let cancelled = false
    setIsRendering(true)
    setRenderError(undefined)
    docxContainerRef.current.replaceChildren()

    fetch(fileUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Falha ao ler o arquivo: ${response.status}`)
        return response.arrayBuffer()
      })
      .then((buffer) =>
        renderAsync(buffer, docxContainerRef.current as HTMLDivElement, undefined, {
          className: 'docx-preview',
          inWrapper: true,
          breakPages: true,
        }),
      )
      .catch(() => {
        if (!cancelled)
          setRenderError('O arquivo foi baixado, mas não foi possível renderizar o DOCX.')
      })
      .finally(() => {
        if (!cancelled) setIsRendering(false)
      })

    return () => {
      cancelled = true
      docxContainerRef.current?.replaceChildren()
    }
  }, [fileQuery.data?.type, fileUrl, storagePath])

  return {
    docxContainerRef,
    fileQuery,
    fileUrl,
    isRendering,
    renderError,
  }
}
