import type { MouseEvent } from 'react'
import type { ExceptionDecisionActionsProps } from './types'
export function useExceptionDecisionActions(props: ExceptionDecisionActionsProps) {
  function handleReject(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    props.onOpenReject(props.exceptionId)
  }
  function handleApprove(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    props.approveException(props.exceptionId)
  }
  return { handleReject, handleApprove }
}
