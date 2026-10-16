import type { DocumentException } from '../types'
import type { useDocumentExceptionCard } from '../document-exception-card/use-document-exception-card'
import { ExceptionDecisionActions } from '../exception-decision-actions'
import { Badge } from '@/ui/shadcn/badge'

export type ExceptionCardActionsProps = {
  approveException: (exceptionId: string) => void
  canApprove: boolean
  exception: DocumentException
  isApprovingException: boolean
  onOpenReject: (exceptionId: string) => void
  status: ReturnType<typeof useDocumentExceptionCard>['status']
}

export const ExceptionCardActions = ({
  approveException,
  canApprove,
  exception,
  isApprovingException,
  onOpenReject,
  status,
}: ExceptionCardActionsProps) => (
  <div className='flex items-center gap-3'>
    {exception.status === 'PENDING' && canApprove && (
      <ExceptionDecisionActions
        approveException={approveException}
        exceptionId={exception.id}
        isApprovingException={isApprovingException}
        onOpenReject={onOpenReject}
      />
    )}
    <Badge variant='outline' className={status.className}>
      {status.label}
    </Badge>
  </div>
)
