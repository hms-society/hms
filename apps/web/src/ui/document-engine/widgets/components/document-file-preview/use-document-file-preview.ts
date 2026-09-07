import { useEffect, useRef, useState, type MouseEvent } from 'react'

import { useDocumentFileQuery } from '@/ui/document-engine/hooks/use-document-file-query'
import { useDocumentFileUrlQuery } from '@/ui/document-engine/hooks/use-document-file-url-query'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.25
const BASE_PAGE_WIDTH = 900

export function useDocumentFilePreview(documentFileId: string) {
  const [numPages, setNumPages] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const viewerRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  })

  const { file, isLoadingFile, isErrorFile } = useDocumentFileQuery(documentFileId)
  const { fileUrl, isLoadingFileUrl, isErrorFileUrl } = useDocumentFileUrlQuery(
    file?.storagePath,
  )

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  function handleZoomIn() {
    setZoom((previousZoom) => Math.min(MAX_ZOOM, previousZoom + ZOOM_STEP))
  }

  function handleZoomOut() {
    setZoom((previousZoom) => Math.max(MIN_ZOOM, previousZoom - ZOOM_STEP))
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (!canPan || !viewerRef.current) return

    event.preventDefault()
    setIsDragging(true)
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewerRef.current.scrollLeft,
      scrollTop: viewerRef.current.scrollTop,
    }
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!isDragging || !viewerRef.current) return

    const walkX = event.clientX - dragStart.current.x
    const walkY = event.clientY - dragStart.current.y

    viewerRef.current.scrollLeft = dragStart.current.scrollLeft - walkX
    viewerRef.current.scrollTop = dragStart.current.scrollTop - walkY
  }

  function handleMouseUp() {
    setIsDragging(false)
  }

  function handleDownload() {
    if (!file || !fileUrl) return

    const link = window.document.createElement('a')
    link.href = fileUrl
    link.download = file.originalName
    link.click()
  }

  const canPan = zoom > 1
  const pageWidth = BASE_PAGE_WIDTH * zoom
  const format = file?.mimeType.split('/')[1]?.toUpperCase() || 'ARQUIVO'

  return {
    file,
    fileUrl,
    numPages,
    setNumPages,
    zoom,
    pageWidth,
    isDragging,
    canPan,
    viewerRef,
    isLoadingFile,
    isErrorFile,
    isLoadingUrl: isLoadingFileUrl,
    isErrorUrl: isErrorFileUrl,
    format,
    handleDownload,
    handleZoomIn,
    handleZoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  }
}
