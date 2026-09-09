import { useEffect, useState } from 'react'
export type SigningDocumentViewerProps = {
  documentId: string
  title: string
  pageCount?: number
  content: ArrayBuffer | null
  isLoading: boolean
  error?: string
  onRetry: () => void
}

export function useSigningDocumentViewer(props: SigningDocumentViewerProps) {
  const [objectUrl, setObjectUrl] = useState<string>()
  useEffect(() => {
    if (!props.content) {
      setObjectUrl(undefined)
      return
    }
    const url = URL.createObjectURL(
      new Blob([props.content], { type: 'application/pdf' }),
    )
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [props.content])
  return { currentPage: 1, objectUrl }
}
