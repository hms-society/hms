import type {
  FormalizationSignatureTrackingDocument,
  FormalizationSignatureTrackingSignatory,
  FormalizationSignatureDocumentContentKind,
} from '@hms/core/formalization/domain/structures'
import { useState } from 'react'

export type SignatureDocumentGroupProps = {
  document: FormalizationSignatureTrackingDocument
  isResending: boolean
  onRequestResend: (signatory: FormalizationSignatureTrackingSignatory) => void
  canViewDocuments: boolean
  isSignatureRequestConfirmed: boolean
  onGetDocumentContent: (
    requestDocumentId: string,
    contentKind: FormalizationSignatureDocumentContentKind,
  ) => Promise<Blob>
}

export function useSignatureDocumentGroup({
  document,
  canViewDocuments,
  isSignatureRequestConfirmed,
  onGetDocumentContent,
}: SignatureDocumentGroupProps) {
  const [openingDocumentKind, setOpeningDocumentKind] =
    useState<FormalizationSignatureDocumentContentKind | null>(null)
  const [documentContentError, setDocumentContentError] = useState<string | undefined>()
  const canOpenDocuments =
    canViewDocuments &&
    isSignatureRequestConfirmed &&
    document.status === 'confirmed' &&
    document.signedArtifactAvailable

  async function handleOpenDocument(
    contentKind: FormalizationSignatureDocumentContentKind,
  ) {
    if (!canOpenDocuments || openingDocumentKind) return

    setOpeningDocumentKind(contentKind)
    setDocumentContentError(undefined)
    try {
      const content = await onGetDocumentContent(document.requestDocumentId, contentKind)
      const contentUrl = URL.createObjectURL(content)
      const anchor = window.document.createElement('a')
      anchor.href = contentUrl
      anchor.target = '_blank'
      anchor.rel = 'noopener noreferrer'
      anchor.click()
    } catch {
      setDocumentContentError('Não foi possível abrir o documento. Tente novamente.')
    } finally {
      setOpeningDocumentKind(null)
    }
  }

  return {
    canOpenDocuments,
    documentContentError,
    handleOpenDocument,
    openingDocumentKind,
    signatories: [...document.signatories].sort((first, second) =>
      first.recipientId.localeCompare(second.recipientId),
    ),
  }
}
