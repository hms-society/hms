import { useSignatureDocumentQuery } from '@/ui/formalization/hooks/use-signature-document-query'

export type SigningGatewayDocument = {
  id: string
  title: string
  position: number
  pageCount?: number
}

export type DocumentReadingStepProps = {
  documents: readonly SigningGatewayDocument[]
  acknowledgedDocumentIds: readonly string[]
  activeDocumentId: string
  isPending: boolean
  actionError?: string
  onSelectDocument: (requestDocumentId: string) => void
  onAcknowledgeDocument: (requestDocumentId: string) => void
  onContinue: () => void
}

export function useDocumentReadingStep(props: DocumentReadingStepProps) {
  const activeDocument =
    props.documents.find((document) => document.id === props.activeDocumentId) ??
    props.documents[0]
  const query = useSignatureDocumentQuery(activeDocument?.id, Boolean(activeDocument))
  const acknowledged = activeDocument
    ? props.acknowledgedDocumentIds.includes(activeDocument.id)
    : false
  const allAcknowledged = props.documents.every((document) =>
    props.acknowledgedDocumentIds.includes(document.id),
  )

  return {
    activeDocument,
    actionError: props.actionError,
    acknowledged,
    allAcknowledged,
    content: query.content,
    documentError: query.error,
    isLoading: query.isLoading,
    handleRetry: query.refetch,
    handleAcknowledge: () => {
      if (activeDocument && !acknowledged) props.onAcknowledgeDocument(activeDocument.id)
    },
    handleContinue: props.onContinue,
  }
}
