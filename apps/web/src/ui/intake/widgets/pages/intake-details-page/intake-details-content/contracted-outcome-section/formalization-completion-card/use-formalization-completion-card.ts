import type { FormalizationCompletionSummary } from '@hms/core/formalization/domain/structures'

export type FormalizationCompletionCardProps = {
  summary?: FormalizationCompletionSummary
  isUnavailable: boolean
  onRetry: () => void
}

export function useFormalizationCompletionCard({
  summary,
  isUnavailable,
}: FormalizationCompletionCardProps) {
  function formatDate() {
    return summary
      ? new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'long',
          timeStyle: 'short',
        }).format(summary.completedAt)
      : 'Data indisponível'
  }

  return {
    completedAtLabel: formatDate(),
    isCompleted: summary?.status === 'completed',
    isUnavailable,
    formalizationId: summary?.formalizationId,
  }
}
