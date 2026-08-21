import { useEffect, useRef, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BROWSER_ENV } from '@/constants'
import { supabaseClient } from '@/provision/auth/supabase/supabase-client'
import { useDocumentFileQuery } from '@/ui/shared/hooks/use-document-file-query'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2
const ZOOM_STEP = 0.25
const BASE_PAGE_WIDTH = 900

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]} ${i > 0 ? '' : ''}`.trim()
}

export const useDocumentViewer = () => {
  const { fileId } = useParams({ from: '/lotes-documentos/$fileId' })

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

  const {
    data: file,
    isLoading: isLoadingFile,
    isError: isErrorFile,
  } = useDocumentFileQuery(fileId)

  const {
    data: fileUrl,
    isLoading: isLoadingUrl,
    isError: isErrorUrl,
  } = useQuery({
    queryKey: ['document-blob', file?.storagePath],
    queryFn: async () => {
      if (!file?.storagePath) return null

      const { data, error } = await supabaseClient.storage
        .from(BROWSER_ENV.supabaseStorageBucket)
        .download(file.storagePath)

      if (error) {
        throw error
      }

      return URL.createObjectURL(data)
    },
    enabled: !!file?.storagePath,
    retry: false,
  })

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [fileUrl])

  const handleZoomIn = () => {
    setZoom((previousZoom) => Math.min(MAX_ZOOM, previousZoom + ZOOM_STEP))
  }

  const handleZoomOut = () => {
    setZoom((previousZoom) => Math.max(MIN_ZOOM, previousZoom - ZOOM_STEP))
  }

  const canPan = zoom > 1

  const handleMouseDown = (event: React.MouseEvent) => {
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

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !viewerRef.current) return

    const container = viewerRef.current

    const walkX = event.clientX - dragStart.current.x
    const walkY = event.clientY - dragStart.current.y

    container.scrollLeft = dragStart.current.scrollLeft - walkX
    container.scrollTop = dragStart.current.scrollTop - walkY
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const pageWidth = BASE_PAGE_WIDTH * zoom

  const format = file?.mimeType.split('/')[1]?.toUpperCase() || 'ARQUIVO'

  const formattedDate = file
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(file.createdAt))
    : null

  return {
    file,
    fileUrl,
    fileId,

    numPages,
    setNumPages,

    zoom,
    pageWidth,

    isDragging,
    canPan,

    viewerRef,

    isLoadingFile,
    isErrorFile,
    isLoadingUrl,
    isErrorUrl,

    format,
    formattedDate,

    handleZoomIn,
    handleZoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,

    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  }
}
