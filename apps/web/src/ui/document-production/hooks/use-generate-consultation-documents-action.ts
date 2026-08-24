import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ConsultationDocumentListItem } from '@hms/core/consultation/domain/structures'
import { HTTP_STATUS_CODE } from '@hms/core/shared/constants'

import { useEffect, useRef, useState } from 'react'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { consultationDocumentQueryKeys } from './consultation-document-query-keys'

const POLL_INTERVAL_MS = 3_000
const POLL_TIMEOUT_MS = 2 * 60 * 1_000

type PendingGeneration = {
  readonly attemptId: string
  readonly baselineVersionId?: string
  readonly baselineVersionNumber?: number
  readonly startedAt: number
}

type GenerationContext = {
  readonly attemptId: string
  readonly documentIds: readonly string[]
  readonly consultationId?: string
}

function hasNewerVersion(
  document: ConsultationDocumentListItem | undefined,
  pending: PendingGeneration,
) {
  const latestVersion = [...(document?.versions ?? [])].sort(
    (left, right) => right.versionNumber - left.versionNumber,
  )[0]

  return Boolean(
    latestVersion && latestVersion.versionNumber > (pending.baselineVersionNumber ?? -1),
  )
}

export function useGenerateConsultationDocumentsAction(consultationId?: string) {
  const { consultationDocumentProductionService } = useRestContext()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<Record<string, PendingGeneration>>({})
  const [timedOut, setTimedOut] = useState<readonly string[]>([])
  const pendingRef = useRef(pending)
  const attemptCounter = useRef(0)
  const consultationIdRef = useRef(consultationId)
  const isActiveRef = useRef(true)
  const scheduledTimersRef = useRef<Set<number>>(new Set())
  pendingRef.current = pending
  consultationIdRef.current = consultationId

  function isContextActive(context: GenerationContext) {
    return isActiveRef.current && consultationIdRef.current === context.consultationId
  }

  function clearPending(context: GenerationContext) {
    setPending((entries) => {
      const next = { ...entries }
      for (const documentId of context.documentIds) {
        if (next[documentId]?.attemptId === context.attemptId) delete next[documentId]
      }
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await consultationDocumentProductionService.generateDocuments(
        consultationId as string,
      )
      if (response.statusCode !== HTTP_STATUS_CODE.conflict && response.isFailure)
        response.throwError()
      return response
    },
    onMutate: async (): Promise<GenerationContext> => {
      const documents = queryClient.getQueryData<readonly ConsultationDocumentListItem[]>(
        consultationDocumentQueryKeys.list(consultationId ?? ''),
      )
      const documentIds = documents?.map((document) => document.id) ?? []
      const attemptId = `consultation-document-batch-${++attemptCounter.current}`
      const startedAt = Date.now()
      const entries = Object.fromEntries(
        documentIds.map((documentId) => {
          const current = documents?.find((document) => document.id === documentId)
          const latest = [...(current?.versions ?? [])].sort(
            (left, right) => right.versionNumber - left.versionNumber,
          )[0]
          return [
            documentId,
            {
              attemptId,
              baselineVersionId: latest?.id,
              baselineVersionNumber: latest?.versionNumber,
              startedAt,
            } satisfies PendingGeneration,
          ]
        }),
      )
      setTimedOut((ids) => ids.filter((id) => !documentIds.includes(id)))
      setPending(entries)

      void queryClient.cancelQueries({
        queryKey: consultationDocumentQueryKeys.list(consultationId ?? ''),
      })

      return { attemptId, documentIds, consultationId }
    },
    onError: (_error, _variables, context) => {
      if (!context || !isContextActive(context)) return
      clearPending(context)
    },
    onSuccess: (response, _variables, context) => {
      if (!context || !isContextActive(context)) return
      if (response.statusCode === HTTP_STATUS_CODE.conflict) {
        clearPending(context)
        void queryClient.refetchQueries({
          queryKey: consultationDocumentQueryKeys.list(consultationId ?? ''),
          type: 'active',
        })
        return
      }
      void pollDocuments(context)
    },
  })

  async function pollDocuments(context: GenerationContext) {
    if (!consultationId || context.documentIds.length === 0 || !isContextActive(context))
      return
    const listKey = consultationDocumentQueryKeys.list(consultationId)
    const startedAt = Math.min(
      ...context.documentIds.map((id) => pendingRef.current[id]?.startedAt ?? Date.now()),
    )
    if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
      setPending((entries) => {
        const next = { ...entries }
        for (const documentId of context.documentIds) {
          if (next[documentId]?.attemptId === context.attemptId) delete next[documentId]
        }
        return next
      })
      setTimedOut((ids) => [...new Set([...ids, ...context.documentIds])])
      return
    }

    await queryClient.refetchQueries({ queryKey: listKey, type: 'active' })
    if (!isContextActive(context)) return
    const documents =
      queryClient.getQueryData<readonly ConsultationDocumentListItem[]>(listKey)
    const completed = context.documentIds.filter((documentId) => {
      const current = pendingRef.current[documentId]
      return (
        current?.attemptId === context.attemptId &&
        hasNewerVersion(
          documents?.find((item) => item.id === documentId),
          current,
        )
      )
    })
    const remaining = context.documentIds.filter((id) => !completed.includes(id))

    if (!isContextActive(context)) return
    setPending((entries) => {
      const next = { ...entries }
      for (const documentId of completed) {
        if (next[documentId]?.attemptId === context.attemptId) delete next[documentId]
      }
      return next
    })
    if (remaining.length > 0) {
      const timer = window.setTimeout(() => {
        scheduledTimersRef.current.delete(timer)
        void pollDocuments({ ...context, documentIds: remaining })
      }, POLL_INTERVAL_MS)
      scheduledTimersRef.current.add(timer)
    }
  }

  useEffect(() => {
    isActiveRef.current = true
    consultationIdRef.current = consultationId
    setPending({})
    setTimedOut([])

    return () => {
      isActiveRef.current = false
      for (const timer of scheduledTimersRef.current) window.clearTimeout(timer)
      scheduledTimersRef.current.clear()
    }
  }, [consultationId])

  return {
    generateDocuments: mutation.mutateAsync,
    error: mutation.error,
    isGeneratingDocuments: mutation.isPending,
    pendingDocumentIds: Object.keys(pending),
    timedOutDocumentIds: timedOut,
  }
}
