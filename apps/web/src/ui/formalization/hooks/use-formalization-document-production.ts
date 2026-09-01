import type { FormalizationDocumentListItem } from '@hms/core/formalization/domain/structures'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { useDocumentPackage } from '@/ui/document-production/widgets/components/document-package'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { formalizationQueryKeys } from './formalization-query-keys'

const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 2 * 60 * 1_000

type PendingGeneration = {
  readonly generationId: string
  readonly startedAt: number
}

export function useFormalizationDocumentProduction(
  formalizationId: string,
  isAvailable: boolean,
) {
  const { formalizationService } = useRestContext()
  const queryClient = useQueryClient()
  const [pendingGenerations, setPendingGenerations] = useState<
    Record<string, PendingGeneration>
  >({})
  const [timedOutDocumentIds, setTimedOutDocumentIds] = useState<ReadonlySet<string>>(
    new Set(),
  )
  const activeRef = useRef(true)
  const pendingRef = useRef(pendingGenerations)
  const timersRef = useRef<Set<number>>(new Set())
  pendingRef.current = pendingGenerations

  const documentsQuery = useQuery({
    queryKey: formalizationQueryKeys.documents(formalizationId),
    enabled: isAvailable,
    retry: false,
    queryFn: async () => {
      const response = await formalizationService.listDocuments(formalizationId)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })

  const selectionQuery = useQuery({
    queryKey: formalizationQueryKeys.selection(formalizationId),
    enabled: isAvailable,
    retry: false,
    queryFn: async () => {
      const response = await formalizationService.getDocumentSelection(formalizationId)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })

  const selectionMutation = useMutation({
    mutationFn: async (documentSpecificationIds: readonly string[]) => {
      const response = await formalizationService.replaceDocumentSelection(
        formalizationId,
        documentSpecificationIds,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (selection) => {
      queryClient.setQueryData(
        formalizationQueryKeys.selection(formalizationId),
        selection,
      )
      void queryClient
        .invalidateQueries({
          queryKey: formalizationQueryKeys.documents(formalizationId),
        })
        .catch(() => undefined)
    },
  })

  const generationMutation = useMutation({
    mutationFn: async ({
      documentId,
      instructions,
    }: {
      documentId: string
      instructions?: string
    }) => {
      const response = await formalizationService.generateDocument(
        formalizationId,
        documentId,
        instructions ? { instructions } : undefined,
      )
      if (response.statusCode !== HTTP_STATUS_CODE.conflict && response.isFailure) {
        response.throwError()
      }
      return response
    },
  })

  const cancellationMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const generationId = pendingRef.current[documentId]?.generationId
      if (!generationId) return undefined
      const response = await formalizationService.cancelGeneration(
        formalizationId,
        generationId,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (_result, documentId) => {
      setPendingGenerations((current) => {
        const next = { ...current }
        delete next[documentId]
        return next
      })
      void queryClient
        .invalidateQueries({
          queryKey: formalizationQueryKeys.documents(formalizationId),
        })
        .catch(() => undefined)
    },
  })

  const confirmMutation = useMutation({
    mutationFn: async (expectedVersion: number) => {
      const response = await formalizationService.confirmDocuments(
        formalizationId,
        expectedVersion,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: formalizationQueryKeys.detail(formalizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: formalizationQueryKeys.selection(formalizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: formalizationQueryKeys.documents(formalizationId),
        }),
      ]).catch(() => undefined)
    },
  })

  async function pollGeneration(documentId: string, generationId: string) {
    const startedAt = pendingRef.current[documentId]?.startedAt ?? Date.now()
    if (
      !activeRef.current ||
      pendingRef.current[documentId]?.generationId !== generationId
    ) {
      return
    }
    if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
      setPendingGenerations((current) => {
        const next = { ...current }
        delete next[documentId]
        return next
      })
      setTimedOutDocumentIds((current) => new Set(current).add(documentId))
      return
    }

    await queryClient.refetchQueries({
      queryKey: formalizationQueryKeys.documents(formalizationId),
      type: 'active',
    })
    const document = queryClient
      .getQueryData<readonly FormalizationDocumentListItem[]>(
        formalizationQueryKeys.documents(formalizationId),
      )
      ?.find((item) => item.id === documentId)
    if (
      document?.generationStatus === 'completed' ||
      document?.generationStatus === 'failed' ||
      document?.generationStatus === 'cancelled'
    ) {
      setPendingGenerations((current) => {
        const next = { ...current }
        delete next[documentId]
        return next
      })
      return
    }

    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer)
      void pollGeneration(documentId, generationId).catch(() => undefined)
    }, POLL_INTERVAL_MS)
    timersRef.current.add(timer)
  }

  async function handleGenerateDocument(documentId: string, instructions?: string) {
    setTimedOutDocumentIds((current) => {
      const next = new Set(current)
      next.delete(documentId)
      return next
    })
    const response = await generationMutation.mutateAsync({ documentId, instructions })
    if (response.statusCode === HTTP_STATUS_CODE.conflict || !response.body) return
    setPendingGenerations((current) => ({
      ...current,
      [documentId]: {
        generationId: response.body.documentGenerationId,
        startedAt: Date.now(),
      },
    }))
    void pollGeneration(documentId, response.body.documentGenerationId).catch(
      () => undefined,
    )
  }

  useEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
      for (const timer of timersRef.current) window.clearTimeout(timer)
      timersRef.current.clear()
    }
  }, [])

  const documents = useDocumentPackage({
    documents: documentsQuery.data ?? [],
    pendingDocumentIds: new Set(Object.keys(pendingGenerations)),
    timedOutDocumentIds,
  })

  return {
    documents,
    documentsQuery,
    selectionQuery,
    selectionMutation,
    generationMutation,
    cancellationMutation,
    confirmMutation,
    handleGenerateDocument,
    isReadOnly: !isAvailable,
    isCancellingDocument: cancellationMutation.isPending,
    isPackageConfirmed: Boolean(selectionQuery.data?.confirmedAt),
    isConfirmationEligible:
      documents.length > 0 &&
      documents.every(
        (item) =>
          item.document.isFresh &&
          (item.status === 'approved' || item.status === 'rejected'),
      ),
  }
}

export type FormalizationDocumentProductionController = ReturnType<
  typeof useFormalizationDocumentProduction
>
