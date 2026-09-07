import type { IconName } from '@/ui/shared/widgets/components/icon'

export type LawyerCaseStatus =
  | 'Em formação'
  | 'Em andamento'
  | 'Aguardando cliente'
  | 'Em produção jurídica'
  | 'Protocolo e entrega'
  | 'Execução'
  | 'Encerrado'

export type LawyerCasePriority = 'Alta' | 'Normal' | 'Baixa'

export type LawyerCaseListItem = {
  id: string
  title: string
  clientName: string
  publicCode: string
  legalArea: string
  status: LawyerCaseStatus
  priority: LawyerCasePriority
  nextAction: string
  updatedAt: string
  team: {
    collaboratorId: string
    initials: string
    name: string
    role: string
    className: string
  }[]
  progress: {
    completedCount: number
    totalCount: number
    icon: IconName
  }
}

export type LawyerCaseViewItem = LawyerCaseListItem & {
  displayTeam: string
  statusStyle: string
}
