import type { useDocumentExceptionCard } from '../document-exception-card/use-document-exception-card'
import type { DocumentException } from '../types'
import { ExceptionCardDetails } from '../exception-card-details'
import { ExceptionCardActions } from '../exception-card-actions'

export type DocumentExceptionCardViewProps = {
  approveException: (exceptionId: string) => void
  canApprove: boolean
  card: ReturnType<typeof useDocumentExceptionCard>
  exception: DocumentException
  isApprovingException: boolean
  onOpenReject: (exceptionId: string) => void
  onViewJustification: (justification: string) => void
  title: string
}

export const DocumentExceptionCardView = ({
  card,
  ...props
}: DocumentExceptionCardViewProps) => (
  // biome-ignore lint/a11y/useSemanticElements: this container may have nested buttons when PENDING, so we cannot use a native button
  <div
    className={card.className}
    key={props.exception.id}
    role='button'
    tabIndex={0}
    onKeyDown={card.handleKeyDown}
    onClick={card.handleOpenJustification}
  >
    <ExceptionCardDetails exception={props.exception} title={props.title} />
    <ExceptionCardActions {...props} status={card.status} />
  </div>
)
