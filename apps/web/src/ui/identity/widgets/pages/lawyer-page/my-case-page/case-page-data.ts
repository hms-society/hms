import type {
  ActivityItem,
  CaseStage,
  CaseTask,
  CaseTeamMember,
  CaseTimelineItem,
} from './types'
import {
  CaseMemberRole,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'

export const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 'a1',
    icon: 'check',
    title: 'Procuração validada',
    description: 'João Pedro (Paralegal) - hoje, 09:12',
  },
  {
    id: 'a2',
    icon: 'inbox',
    title: 'Lote LOTE-20260703-0112 recebido',
    description: 'Portal do Cliente - Antônio Carvalho - 03/07, 16:40',
  },
  {
    id: 'a3',
    icon: 'list-checks',
    title: 'Checklist instanciado do template Previdenciário v3',
    description: 'Sistema - 03/07, 14:20',
  },
]

export const CASE_TASKS: CaseTask[] = [
  {
    title: 'Mensagem assistida de solicitação de documentos',
    description: 'Aguardando sua aprovação antes do envio ao cliente via WhatsApp',
    assignee: 'Você',
    status: 'Aguardando aprovação',
    icon: 'message-square-text',
  },
  {
    title: 'Conferir dados da Certidão de Tempo de Contribuição no CNIS',
    description: 'Tarefa operacional - vence em 5 dias',
    assignee: 'João Pedro (Paralegal)',
    status: 'Em aberto',
    icon: 'list-checks',
  },
]

export const CASE_TIMELINE: CaseTimelineItem[] = [
  {
    icon: 'users',
    title: 'Equipe do caso definida',
    description: 'Dr. Ricardo Mendes - hoje, 09:42',
  },
  {
    icon: 'list-checks',
    title: 'Checklist instanciado do template Previdenciário',
    description: 'Sistema - 03/07, 14:20',
  },
  {
    icon: 'briefcase',
    title: 'Caso aberto automaticamente após contratação',
    description: 'Sistema - 03/07, 14:20',
  },
  {
    icon: 'pencil',
    title: 'Contratação formalizada',
    description: 'Assinatura eletrônica - 03/07, 14:18',
  },
]

export const CASE_TEAM: CaseTeamMember[] = [
  {
    initials: 'RM',
    name: 'Dr. Ricardo Mendes',
    role: CaseMemberRole.Manager,
    className: 'bg-primary text-primary-foreground',
  },
  {
    initials: 'MC',
    name: 'Mariana Costa',
    role: CaseMemberRole.Collaborator,
    className: 'bg-accent text-accent-foreground',
  },
  {
    initials: 'JP',
    name: 'João Pedro Silva',
    role: CaseMemberRole.Collaborator,
    className: 'bg-highlight text-highlight-foreground',
  },
  {
    initials: 'BO',
    name: 'Beatriz Oliveira',
    role: CaseMemberRole.Collaborator,
    className: 'bg-muted text-foreground',
  },
]

export const CASE_STAGES: CaseStage[] = [
  {
    icon: 'file-text',
    label: 'Documentação',
    status: 'Documentação',
    isActive: true,
  },
  { icon: 'pencil', label: 'Produção Jurídica' },
  { icon: 'inbox', label: 'Protocolo / Entrega' },
  { icon: 'chart-line', label: 'Execução' },
  { icon: 'check', label: 'Encerramento' },
]

const CASE_STATUS_LABELS: Record<LegalCaseStatus, string> = {
  [LegalCaseStatus.Documentation]: 'Documentação em formação',
  [LegalCaseStatus.ReadyForLegalProduction]: 'Em andamento',
  [LegalCaseStatus.LegalProduction]: 'Em produção jurídica',
  [LegalCaseStatus.ProtocolDelivery]: 'Protocolo e entrega',
  [LegalCaseStatus.Execution]: 'Execução',
  [LegalCaseStatus.Closed]: 'Encerrado',
}

export const getCaseStages = (caseStatus?: string): CaseStage[] => {
  const activeStageIndex = getActiveStageIndex(caseStatus)
  const isCaseClosed = caseStatus === LegalCaseStatus.Closed

  return CASE_STAGES.map((stage, index) => {
    if (index < activeStageIndex) {
      return {
        ...stage,
        icon: 'check',
        status: 'Concluída',
        isActive: false,
      }
    }

    if (index === activeStageIndex) {
      return {
        ...stage,
        icon: isCaseClosed ? 'check' : stage.icon,
        status: isCaseClosed ? 'Concluído' : stage.status,
        isActive: true,
      }
    }

    return { ...stage, isActive: false }
  })
}

export const getCaseStatusLabel = (caseStatus?: string): string => {
  if (!caseStatus) return 'Carregando status…'

  return CASE_STATUS_LABELS[caseStatus as LegalCaseStatus] ?? 'Status indisponível'
}

function getActiveStageIndex(caseStatus?: string) {
  switch (caseStatus) {
    case LegalCaseStatus.ReadyForLegalProduction:
    case LegalCaseStatus.LegalProduction:
      return 1
    case LegalCaseStatus.ProtocolDelivery:
      return 2
    case LegalCaseStatus.Execution:
      return 3
    case LegalCaseStatus.Closed:
      return 4
    default:
      return 0
  }
}

export const TEAM_MEMBERS = CASE_TEAM.map(({ className, initials }) => ({
  className,
  initials,
}))
