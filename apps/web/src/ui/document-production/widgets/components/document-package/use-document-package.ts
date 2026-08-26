import type { DocumentPackageItem, DocumentPackageStatus } from './types'
import { useMemo } from 'react'

export type DocumentPackageSourceVersion = {
  readonly id: string
  readonly versionNumber: number
  readonly status: 'in_review' | 'approved' | 'rejected'
}

export type DocumentPackageSourceItem = {
  readonly id: string
  readonly title: string
  readonly currentVersionId?: string
  readonly generationStatus?: string
  readonly versions: readonly DocumentPackageSourceVersion[]
}

export type DocumentPackageViewModel<T extends DocumentPackageSourceItem> =
  DocumentPackageItem & {
    document: T
    latestVersion?: T['versions'][number]
  }

function getStatusLabel(status: DocumentPackageStatus) {
  if (status === 'in_review') return 'Em revisão'
  if (status === 'rejected') return 'Rejeitado'
  if (status === 'approved') return 'Aprovado'
  if (status === 'failed') return 'Falha na geração'
  if (status === 'generating') return 'Gerando'
  return 'Não gerado'
}

function getLatestVersion<T extends DocumentPackageSourceItem>(document: T) {
  return [...document.versions].sort(
    (left, right) => right.versionNumber - left.versionNumber,
  )[0]
}

function getDocumentStatus(
  latestVersion: DocumentPackageSourceVersion | undefined,
  generationStatus: string | undefined,
  isOptimisticallyGenerating: boolean,
  isGenerationStopped: boolean,
): DocumentPackageStatus {
  if (generationStatus === 'failed') return 'failed'

  if (
    !isGenerationStopped &&
    (isOptimisticallyGenerating ||
      generationStatus === 'pending' ||
      generationStatus === 'running')
  ) {
    return 'generating'
  }

  return latestVersion?.status ?? 'not_generated'
}

export type UseDocumentPackageOptions<T extends DocumentPackageSourceItem> = {
  documents: readonly T[]
  pendingDocumentIds?: ReadonlySet<string>
  timedOutDocumentIds?: ReadonlySet<string>
  cancelledDocumentIds?: ReadonlySet<string>
}

export function useDocumentPackage<T extends DocumentPackageSourceItem>({
  documents,
  pendingDocumentIds = new Set(),
  timedOutDocumentIds = new Set(),
  cancelledDocumentIds = new Set(),
}: UseDocumentPackageOptions<T>): readonly DocumentPackageViewModel<T>[] {
  return useMemo(
    () =>
      documents.map((document) => {
        const latestVersion = getLatestVersion(document)
        const isOptimisticallyGenerating =
          pendingDocumentIds.has(document.id) && !cancelledDocumentIds.has(document.id)
        const isGenerationStopped =
          cancelledDocumentIds.has(document.id) || timedOutDocumentIds.has(document.id)
        const status = getDocumentStatus(
          latestVersion,
          document.generationStatus,
          isOptimisticallyGenerating,
          isGenerationStopped,
        )

        return {
          document,
          id: document.id,
          title: document.title,
          latestVersion,
          status,
          statusLabel: getStatusLabel(status),
          isCurrent: Boolean(
            latestVersion && latestVersion.id === document.currentVersionId,
          ),
          isGenerating: status === 'generating',
          isTimedOut:
            timedOutDocumentIds.has(document.id) &&
            status !== 'generating' &&
            document.generationStatus !== 'failed' &&
            document.generationStatus !== 'cancelled' &&
            !cancelledDocumentIds.has(document.id),
        }
      }),
    [documents, pendingDocumentIds, timedOutDocumentIds, cancelledDocumentIds],
  )
}
