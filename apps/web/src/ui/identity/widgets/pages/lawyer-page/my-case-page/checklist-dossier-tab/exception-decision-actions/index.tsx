import type { ExceptionDecisionActionsProps } from './types'
import { useExceptionDecisionActions } from './use-exception-decision-actions'
import { Button } from '@/ui/shadcn/button'

export type { ExceptionDecisionActionsProps } from './types'

export const ExceptionDecisionActions = (props: ExceptionDecisionActionsProps) => {
  const { handleReject, handleApprove } = useExceptionDecisionActions(props)
  const { isApprovingException } = props
  return (
    <div className='flex items-center gap-2'>
      <Button
        variant='ghost'
        size='xs'
        className='h-7 rounded-full bg-destructive/10 px-3 font-semibold text-destructive'
        onClick={handleReject}
      >
        Recusar
      </Button>
      <Button
        variant='ghost'
        size='xs'
        className='h-7 rounded-full bg-green-600/10 px-3 font-semibold text-green-700'
        onClick={handleApprove}
        disabled={isApprovingException}
      >
        Aprovar
      </Button>
    </div>
  )
}
