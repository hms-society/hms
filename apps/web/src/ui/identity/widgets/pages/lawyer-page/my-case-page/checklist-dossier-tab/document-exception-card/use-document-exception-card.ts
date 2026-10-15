import { format, isPast } from 'date-fns'
import type { KeyboardEvent } from 'react'
import type { useListCaseDocumentExceptionsQuery } from '@/ui/document-engine/hooks/use-list-case-document-exceptions-query'
type DocumentException = ReturnType<
  typeof useListCaseDocumentExceptionsQuery
>['exceptions'][number]

const UNDATED_STATUS_LABELS = {
  APPROVED: 'Aprovado',
  EXPIRED: 'Pendente',
  PENDING: 'Pendente',
  REJECTED: 'Reprovado',
}
const EXPIRED_EXCEPTION_STATUS = {
  label: 'Expirado',
  className: 'text-destructive border-destructive/20 bg-destructive/10',
}

export function useDocumentExceptionCard(
  exception: DocumentException,
  onViewJustification: (justification: string) => void,
) {
  const status = useExceptionCardStatus(exception)
  const rejectionJustification = getRejectionJustification(exception)
  return {
    ...createJustificationHandlers(rejectionJustification, onViewJustification),
    hasRejectionJustification: Boolean(rejectionJustification),
    className: getDocumentExceptionCardClassName(Boolean(rejectionJustification)),
    status,
  }
  function createJustificationHandlers(
    justification: string | undefined,
    onViewJustification: (justification: string) => void,
  ) {
    function open() {
      return justification && onViewJustification(justification)
    }
    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (!justification || !isJustificationActivationKey(event.key)) return
      event.preventDefault()
      open()
    }
    return { handleKeyDown, handleOpenJustification: open }
  }
  function getRejectionJustification(exception: DocumentException) {
    return exception.status === 'REJECTED'
      ? (exception.rejectionJustification ?? undefined)
      : undefined
  }
  function isJustificationActivationKey(key: string) {
    return key === 'Enter' || key === ' '
  }
  function useExceptionCardStatus(exception: DocumentException) {
    const deadline = exception.deadlineDate ? new Date(exception.deadlineDate) : undefined
    if (!deadline) return getUndatedExceptionStatus(exception.status)
    return getDatedExceptionStatus(deadline)
  }
  function getUndatedExceptionStatus(status: DocumentException['status']) {
    return {
      label: UNDATED_STATUS_LABELS[status],
      className: 'text-muted-foreground bg-muted/20',
    }
  }
  function getDatedExceptionStatus(deadline: Date) {
    if (isPast(deadline)) return EXPIRED_EXCEPTION_STATUS
    return {
      label: `No prazo até ${format(deadline, 'dd/MM/yyyy')}`,
      className: 'text-primary border-primary/20 bg-primary/10',
    }
  }
  function getDocumentExceptionCardClassName(hasRejectionJustification: boolean) {
    const base =
      'flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2.5 text-[14px]'
    return hasRejectionJustification
      ? `${base} cursor-pointer bg-red-50 hover:border-red-300`
      : `${base} bg-background`
  }
}
