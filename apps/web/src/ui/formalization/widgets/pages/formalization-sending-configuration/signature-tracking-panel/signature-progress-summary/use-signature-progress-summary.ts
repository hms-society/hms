import type { FormalizationSignatureSendingStatusResponse } from '@hms/core/formalization/domain/structures'

export type SignatureProgressSummaryProps = {
  isRefreshing: boolean
  status: Pick<
    FormalizationSignatureSendingStatusResponse,
    | 'status'
    | 'totalDocuments'
    | 'completedDocuments'
    | 'failedDocuments'
    | 'progressPercentage'
  >
}

export function useSignatureProgressSummary({ status }: SignatureProgressSummaryProps) {
  function getStatusLabel() {
    if (status.status === 'confirmed') return 'Todas confirmadas'
    if (status.status === 'failed') return 'Falha no envio'
    if (status.status === 'reconciliation_required') return 'Reconciliação necessária'
    return 'Envio em andamento'
  }

  const progressPercentage = Math.min(100, Math.max(0, status.progressPercentage ?? 0))

  return {
    completedLabel: `${status.completedDocuments} de ${status.totalDocuments} documentos concluídos`,
    failedLabel:
      status.failedDocuments > 0 ? `${status.failedDocuments} com falha` : undefined,
    progressPercentage,
    statusLabel: getStatusLabel(),
  }
}
