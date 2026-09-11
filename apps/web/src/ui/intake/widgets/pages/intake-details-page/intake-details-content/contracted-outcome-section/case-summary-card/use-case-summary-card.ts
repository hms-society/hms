import type { LegalCaseSummary } from '@hms/core/case-management/domain/structures'

export type CaseSummaryCardProps = {
  legalCase?: LegalCaseSummary
  legalAreaName?: string
  primaryLawyerName?: string
  isUnavailable: boolean
  onRetry: () => void
}

export function useCaseSummaryCard({
  legalAreaName,
  legalCase,
  primaryLawyerName,
  isUnavailable,
}: CaseSummaryCardProps) {
  function getStatusLabel() {
    const labels: Record<string, string> = {
      documentation: 'Documentação',
      legal_production: 'Produção jurídica',
      protocol_delivery: 'Entrega de protocolo',
      execution: 'Execução',
      closed: 'Encerrado',
    }
    return legalCase ? (labels[legalCase.status] ?? legalCase.status) : 'Não iniciado'
  }

  return {
    caseCode: legalCase?.publicCode ?? 'Nenhum caso relacionado',
    dateLabel: legalCase
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
          legalCase.openedAt,
        )
      : undefined,
    isUnavailable,
    legalAreaLabel: legalAreaName ?? 'Área não informada',
    lawyerLabel: primaryLawyerName ?? 'Advogado não informado',
    statusLabel: getStatusLabel(),
  }
}
