import type {
  FormalizationSignatureConfiguration,
  FormalizationSignatureFieldView,
} from '@hms/core/formalization/domain/structures'
import { FormalizationSignatureFieldType } from '@hms/core/formalization/domain/structures'
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  useFormalizationSignatureConfiguration,
  useFormalizationSignaturePreviewContentQuery,
} from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

export type SignatureFieldsTabProps = {
  expectedVersion: number
  configuration: FormalizationSignatureConfiguration
  onOpenSignatories?: () => void
  onUnsavedChangesChange?: (isDirty: boolean) => void
}

type DragState = {
  fieldId: string
  lastX: number
  lastY: number
}

export function useSignatureFieldsTab({
  expectedVersion,
  configuration,
  onUnsavedChangesChange,
}: SignatureFieldsTabProps) {
  const signatureConfiguration = useFormalizationSignatureConfiguration(
    configuration.formalizationId,
  )
  const [documentId, setDocumentId] = useState(
    configuration.documents[0]?.documentId ?? '',
  )
  const document = configuration.documents.find((item) => item.documentId === documentId)
  const [fields, setFields] = useState<FormalizationSignatureFieldView[]>([
    ...(document?.fields ?? []),
  ])
  const previewId = document?.preview?.previewId
  const preview = document?.preview
  const canViewPreview = preview?.state === 'ready' || preview?.state === 'stale'
  const previewContent = useFormalizationSignaturePreviewContentQuery(
    configuration.formalizationId,
    canViewPreview ? previewId : undefined,
  )
  const previewUrl = useMemo(() => {
    const content = previewContent.previewContent
    if (!content || typeof URL.createObjectURL !== 'function') return undefined
    return URL.createObjectURL(content)
  }, [previewContent.previewContent])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const [selectedSignatoryId, setSelectedSignatoryId] = useState(
    configuration.signatories[0]?.signatoryId ?? '',
  )
  const [selectedPage, setSelectedPage] = useState(1)
  const [isDirty, setIsDirty] = useState(false)
  const [isDocumentChangeDialogOpen, setIsDocumentChangeDialogOpen] = useState(false)
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null)
  const [isRemoveAllFieldsDialogOpen, setIsRemoveAllFieldsDialogOpen] = useState(false)
  const dragRef = useRef<DragState | null>(null)
  const draftsRef = useRef(new Map<string, FormalizationSignatureFieldView[]>())
  const viewerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const fieldsRef = useRef(fields)
  const documentIdRef = useRef(documentId)
  const saveInFlightRef = useRef<Promise<void> | null>(null)
  const saveRequestedRef = useRef(false)
  const draftRevisionRef = useRef(0)
  const expectedVersionRef = useRef(expectedVersion)
  const persistLatestRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const [viewerWidth, setViewerWidth] = useState(480)
  const [zoom, setZoom] = useState(1)
  const isReadOnly =
    !configuration.editable || configuration.status === 'preparing_configuration'

  const availableSignatories = useMemo(
    () =>
      configuration.signatories.filter((signatory) =>
        signatory.documentIds.includes(documentId),
      ),
    [configuration.signatories, documentId],
  )

  useEffect(() => {
    fieldsRef.current = fields
    draftRevisionRef.current += 1
  }, [fields])

  useEffect(() => {
    onUnsavedChangesChange?.(isDirty)
  }, [isDirty, onUnsavedChangesChange])

  useEffect(() => {
    return () => onUnsavedChangesChange?.(false)
  }, [onUnsavedChangesChange])

  useEffect(() => {
    documentIdRef.current = documentId
  }, [documentId])

  useEffect(() => {
    if (expectedVersion > expectedVersionRef.current) {
      expectedVersionRef.current = expectedVersion
    }
  }, [expectedVersion])

  useEffect(() => {
    setSelectedSignatoryId((current) =>
      availableSignatories.some((signatory) => signatory.signatoryId === current)
        ? current
        : (availableSignatories[0]?.signatoryId ?? ''),
    )
  }, [availableSignatories])

  useEffect(() => {
    if (document || !configuration.documents[0]) return
    setDocumentId(configuration.documents[0].documentId)
    setFields([...configuration.documents[0].fields])
    setSelectedPage(1)
    setIsDirty(false)
  }, [configuration.documents, document])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      setViewerWidth(entry.contentRect.width)
    })
    observer.observe(viewer)
    return () => observer.disconnect()
  }, [])

  const pageWidth = Math.max(320, Math.round((viewerWidth - 24) * zoom))

  function addField() {
    if (
      isReadOnly ||
      !previewId ||
      !availableSignatories.some(
        (signatory) => signatory.signatoryId === selectedSignatoryId,
      )
    )
      return
    const field: FormalizationSignatureFieldView = {
      fieldId: globalThis.crypto?.randomUUID?.() ?? `field-${Date.now()}`,
      signatoryId: selectedSignatoryId,
      previewId,
      type: FormalizationSignatureFieldType.Signature,
      page: selectedPage,
      positionX: 10,
      positionY: 10,
      width: 24,
      height: 4,
    }
    setFields((current) => [...current, field])
    setIsDirty(true)
  }

  function moveField(fieldId: string, dx: number, dy: number) {
    setFields((current) =>
      current.map((field) =>
        field.fieldId === fieldId
          ? {
              ...field,
              positionX: Math.max(0, Math.min(100 - field.width, field.positionX + dx)),
              positionY: Math.max(0, Math.min(100 - field.height, field.positionY + dy)),
            }
          : field,
      ),
    )
    setIsDirty(true)
  }

  function resizeField(fieldId: string, dw: number, dh: number) {
    setFields((current) =>
      current.map((field) =>
        field.fieldId === fieldId
          ? {
              ...field,
              width: Math.max(1, Math.min(100 - field.positionX, field.width + dw)),
              height: Math.max(1, Math.min(100 - field.positionY, field.height + dh)),
            }
          : field,
      ),
    )
    setIsDirty(true)
  }

  function handleDeleteField(fieldId: string) {
    if (isReadOnly) return
    setFields((current) => current.filter((field) => field.fieldId !== fieldId))
    setIsDirty(true)
  }

  function handleRequestRemoveAllFields() {
    if (isReadOnly || fields.length === 0) return
    setIsRemoveAllFieldsDialogOpen(true)
  }

  function handleRemoveAllFields() {
    if (isReadOnly) return
    setFields([])
    setIsDirty(true)
    setIsRemoveAllFieldsDialogOpen(false)
  }

  function handleFieldKeyDown(
    fieldId: string,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    if (isReadOnly) return
    const amount = event.shiftKey ? 5 : 1
    const resize = event.altKey || event.ctrlKey || event.metaKey
    if (event.key === 'ArrowLeft')
      resize ? resizeField(fieldId, -amount, 0) : moveField(fieldId, -amount, 0)
    if (event.key === 'ArrowRight')
      resize ? resizeField(fieldId, amount, 0) : moveField(fieldId, amount, 0)
    if (event.key === 'ArrowUp')
      resize ? resizeField(fieldId, 0, -amount) : moveField(fieldId, 0, -amount)
    if (event.key === 'ArrowDown')
      resize ? resizeField(fieldId, 0, amount) : moveField(fieldId, 0, amount)
    if (event.key === 'Delete' || event.key === 'Backspace') handleDeleteField(fieldId)
  }

  function handleFieldPointerDown(
    fieldId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (isReadOnly) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { fieldId, lastX: event.clientX, lastY: event.clientY }
  }

  function handleFieldPointerMove(
    fieldId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const drag = dragRef.current
    if (!drag || drag.fieldId !== fieldId) return
    const bounds = pageRef.current?.getBoundingClientRect()
    if (!bounds) return
    moveField(
      fieldId,
      ((event.clientX - drag.lastX) / bounds.width) * 100,
      ((event.clientY - drag.lastY) / bounds.height) * 100,
    )
    dragRef.current = { fieldId, lastX: event.clientX, lastY: event.clientY }
  }

  function handleFieldPointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
  }

  function handleFieldPointerCancel() {
    dragRef.current = null
  }

  function handleRemoveFieldPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
  }

  function handleResizePointerDown(
    fieldId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()
    if (isReadOnly) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { fieldId, lastX: event.clientX, lastY: event.clientY }
  }

  function handleResizePointerMove(
    fieldId: string,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    const drag = dragRef.current
    if (!drag || drag.fieldId !== fieldId) return
    const bounds = pageRef.current?.getBoundingClientRect()
    if (!bounds) return
    resizeField(
      fieldId,
      ((event.clientX - drag.lastX) / bounds.width) * 100,
      ((event.clientY - drag.lastY) / bounds.height) * 100,
    )
    dragRef.current = { fieldId, lastX: event.clientX, lastY: event.clientY }
  }

  function handleResizePointerUp(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
  }

  function handleResizeKeyDown(
    fieldId: string,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    if (isReadOnly) return
    const amount = event.shiftKey ? 5 : 1
    if (event.key === 'ArrowLeft') resizeField(fieldId, -amount, 0)
    if (event.key === 'ArrowRight') resizeField(fieldId, amount, 0)
    if (event.key === 'ArrowUp') resizeField(fieldId, 0, -amount)
    if (event.key === 'ArrowDown') resizeField(fieldId, 0, amount)
  }

  function getDocumentProgress(
    item: FormalizationSignatureConfiguration['documents'][number],
  ) {
    const documentSignatories = configuration.signatories.filter((signatory) =>
      signatory.documentIds.includes(item.documentId),
    )
    const expectedSignatoryIds = documentSignatories.map(
      (signatory) => signatory.signatoryId,
    )
    const configuredFields =
      item.documentId === documentId && isDirty ? fields : item.fields
    const expectedSignatoryIdSet = new Set(expectedSignatoryIds)
    const configuredSignatoryIds = new Set(
      configuredFields
        .filter((field) => expectedSignatoryIdSet.has(field.signatoryId))
        .map((field) => field.signatoryId),
    )

    return {
      configuredFields,
      configuredSignatoriesCount: configuredSignatoryIds.size,
      documentSignatories,
      expectedSignatoryIds,
      hasAllExpectedFields:
        expectedSignatoryIds.length > 0 &&
        configuredSignatoryIds.size === expectedSignatoryIds.length,
    }
  }

  const persistLatest = useCallback(async () => {
    const activeDocumentId = documentIdRef.current
    const activeDocument = configuration.documents.find(
      (item) => item.documentId === activeDocumentId,
    )
    const activePreviewId = activeDocument?.preview?.previewId
    if (!activePreviewId || !activeDocumentId) return
    if (saveInFlightRef.current) {
      saveRequestedRef.current = true
      return
    }

    const revision = draftRevisionRef.current
    const snapshot = fieldsRef.current
    const request = (async () => {
      const savedConfiguration = await signatureConfiguration.replaceSignatureFields({
        documentId: activeDocumentId,
        previewId: activePreviewId,
        fields: snapshot,
        expectedVersion: expectedVersionRef.current,
      })
      expectedVersionRef.current = savedConfiguration.version
    })()
    saveInFlightRef.current = request
    try {
      await request
      if (
        documentIdRef.current === activeDocumentId &&
        draftRevisionRef.current === revision
      ) {
        draftsRef.current.delete(activeDocumentId)
        setIsDirty(false)
      } else {
        saveRequestedRef.current = true
      }
    } finally {
      saveInFlightRef.current = null
      if (saveRequestedRef.current) {
        saveRequestedRef.current = false
        void persistLatestRef.current().catch(() => undefined)
      }
    }
  }, [configuration.documents, signatureConfiguration])

  persistLatestRef.current = persistLatest

  function changeDocument(nextDocumentId: string) {
    if (documentId) draftsRef.current.set(documentId, fieldsRef.current)
    const nextDocument = configuration.documents.find(
      (item) => item.documentId === nextDocumentId,
    )
    if (!nextDocument) return
    documentIdRef.current = nextDocumentId
    setDocumentId(nextDocumentId)
    setFields(draftsRef.current.get(nextDocumentId) ?? [...nextDocument.fields])
    setSelectedPage(1)
    setIsDirty(Boolean(draftsRef.current.get(nextDocumentId)))
  }

  function selectDocument(nextDocumentId: string) {
    if (nextDocumentId === documentId) return
    const nextDocument = configuration.documents.find(
      (item) => item.documentId === nextDocumentId,
    )
    if (!nextDocument) return
    if (isDirty) {
      setPendingDocumentId(nextDocumentId)
      setIsDocumentChangeDialogOpen(true)
      return
    }
    changeDocument(nextDocumentId)
  }

  function handleDocumentChangeDialogOpenChange(open: boolean) {
    setIsDocumentChangeDialogOpen(open)
    if (!open) setPendingDocumentId(null)
  }

  function handleConfirmDocumentChange() {
    if (!pendingDocumentId) return
    changeDocument(pendingDocumentId)
    setPendingDocumentId(null)
    setIsDocumentChangeDialogOpen(false)
  }

  function decreaseZoom() {
    setZoom((current) => Math.max(0.75, current - 0.25))
  }

  function increaseZoom() {
    setZoom((current) => Math.min(1.5, current + 0.25))
  }

  return {
    addField,
    availableSignatories,
    canViewPreview,
    decreaseZoom,
    documentId,
    fields,
    getDocumentProgress,
    handleDeleteField,
    handleConfirmDocumentChange,
    handleDocumentChangeDialogOpenChange,
    handleFieldKeyDown,
    handleFieldPointerCancel,
    handleFieldPointerDown,
    handleFieldPointerMove,
    handleFieldPointerUp,
    handleRemoveFieldPointerDown,
    handleRemoveAllFields,
    handleRequestRemoveAllFields,
    handleResizeKeyDown,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
    increaseZoom,
    isDirty,
    isDocumentChangeDialogOpen,
    isReadOnly,
    isRemoveAllFieldsDialogOpen,
    isReplacingSignatureFields: signatureConfiguration.isReplacingSignatureFields,
    pageRef,
    pageWidth,
    persistLatest,
    preview,
    previewContent,
    previewId,
    previewUrl,
    replaceSignatureFieldsError: signatureConfiguration.replaceSignatureFieldsError,
    retrySignaturePreview: signatureConfiguration.retrySignaturePreview,
    isRetryingSignaturePreview: signatureConfiguration.isRetryingSignaturePreview,
    selectedPage,
    selectedSignatoryId,
    selectDocument,
    setSelectedPage,
    setSelectedSignatoryId,
    setIsRemoveAllFieldsDialogOpen,
    viewerRef,
    zoom,
  }
}
