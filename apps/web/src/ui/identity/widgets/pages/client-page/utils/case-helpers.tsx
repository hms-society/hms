import { Badge } from '@/ui/shadcn/badge'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

export const getStatusBadge = (status?: IntakeStatus, className?: string) => {
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
        <Badge variant='info' className={className}>
          Consulta Realizada
        </Badge>
      )
    case IntakeStatus.ViabilityRegistered:
      return (
        <Badge variant='atention' className={className}>
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

export const getActionType = (areaId?: string) => {
  if (!areaId) return 'Petição Inicial / Cível'
  const id = areaId.toLowerCase()
  if (id.includes('civel') || id.includes('civ')) return 'Ação Ordinária'
  if (id.includes('trabalho') || id.includes('tra')) return 'Reclamação Trabalhista'
  if (id.includes('familia') || id.includes('fam')) return 'Ação de Divórcio'
  return 'Petição Inicial / Cível'
}
