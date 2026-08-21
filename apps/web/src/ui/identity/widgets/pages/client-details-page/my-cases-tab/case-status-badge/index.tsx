import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { Badge } from '@/ui/shadcn/badge'

export type CaseStatusBadgeProps = {
  status?: IntakeStatus
  className?: string
}

export const CaseStatusBadge = ({ status, className }: CaseStatusBadgeProps) => {
  if (!status) return null

  switch (status) {
    case IntakeStatus.Registered:
      return (
        <Badge variant='secondary' className={className}>
          Em análise de documentos
        </Badge>
      )
    case IntakeStatus.ConsultationScheduled:
      return (
        <Badge variant='info' className={className}>
          Consulta Agendada
        </Badge>
      )
    case IntakeStatus.ConsultationCompleted:
      return (
        <Badge variant='success' className={className}>
          Consulta Realizada
        </Badge>
      )
    case IntakeStatus.ViabilityRegistered:
      return (
        <Badge variant='attention' className={className}>
          Em análise de viabilidade
        </Badge>
      )
    case IntakeStatus.InFormalization:
      return (
        <Badge variant='default' className={className}>
          Em formalização
        </Badge>
      )
    case IntakeStatus.Contracted:
      return (
        <Badge variant='success' className={className}>
          Contratado
        </Badge>
      )
    case IntakeStatus.ClosedWithoutContract:
      return (
        <Badge variant='outline' className={className}>
          Encerrado
        </Badge>
      )
    default:
      return (
        <Badge variant='outline' className={className}>
          {status}
        </Badge>
      )
  }
}
