import type { DocumentException } from '../types'
import { useDocumentExceptionCard } from './use-document-exception-card'
import { DocumentExceptionCardView } from '../document-exception-card-view'

export type DocumentExceptionCardProps = {
  approveException: (exceptionId: string) => void
  canApprove: boolean
  exception: DocumentException
  isApprovingException: boolean
  onOpenReject: (exceptionId: string) => void
  onViewJustification: (justification: string) => void
  title: string
}

export const DocumentExceptionCard = (props: DocumentExceptionCardProps) => {
  const card = useDocumentExceptionCard(props.exception, props.onViewJustification)
  return <DocumentExceptionCardView {...props} card={card} />
}
