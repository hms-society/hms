export type ExceptionDecisionActionsProps = {
  approveException: (exceptionId: string) => void
  exceptionId: string
  isApprovingException: boolean
  onOpenReject: (exceptionId: string) => void
}
