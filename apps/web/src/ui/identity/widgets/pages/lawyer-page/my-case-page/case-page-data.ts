import type {
  ActivityItem,
  CaseStage,
  CaseTask,
  CaseTeamMember,
  CaseTimelineItem,
  ChecklistItem,
} from './types'

export const MOCK_CHECKLIST: ChecklistItem[] = [
  {
    id: '1',
    title: 'Procuração Assinada',
    status: 'validado',
    documentName: 'procuracao_assinada.pdf - validado por João Pedro - hoje 09:12',
  },
  {
    id: '2',
    title: 'Documento de Identificação Oficial',
    status: 'solicitado',
    pendencies: 1,
    subtitle: 'Pendência ativa - aguardando cliente há 2 dias',
  },
  {
    id: '3',
    title: 'Comprovante de Vínculo',
    status: 'solicitado',
    pendencies: 1,
    subtitle: 'Pendência ativa - aguardando cliente há 2 dias',
  },
  {
    id: '4',
    title: 'Comprovante de Residência',
    status: 'solicitado',
    pendencies: 1,
    subtitle: 'Pendência ativa - aguardando cliente há 2 dias',
  },
  {
    id: '5',
    title: 'CTPS (Carteira de Trabalho)',
    status: 'solicitado',
    pendencies: 1,
    subtitle: 'Pendência ativa - aguardando cliente há 2 dias',
  },
  {
    id: '6',
    title: 'Certidão de Tempo de Contribuição',
    status: 'nao_solicitado',
    subtitle: 'Ainda não solicitado ao cliente',
  },
  {
    id: '7',
    title: 'Laudos Médicos/Periciais',
    status: 'nao_solicitado',
    subtitle: 'Ainda não solicitado ao cliente',
  },
]

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
    role: 'Advogado Principal - Responsável Técnico',
    className: 'bg-primary text-primary-foreground',
  },
  {
    initials: 'MC',
    name: 'Mariana Costa',
    role: 'Advogada Auxiliar - Execução',
    className: 'bg-accent text-accent-foreground',
  },
  {
    initials: 'JP',
    name: 'João Pedro Silva',
    role: 'Paralegal - Edição',
    className: 'bg-highlight text-highlight-foreground',
  },
  {
    initials: 'BO',
    name: 'Beatriz Oliveira',
    role: 'Estagiária - Visualização',
    className: 'bg-muted text-foreground',
  },
]

export const CASE_STAGES: CaseStage[] = [
  {
    icon: 'file-text',
    label: 'Documentação',
    status: 'Em formação',
    isActive: true,
  },
  { icon: 'pencil', label: 'Produção Jurídica' },
  { icon: 'inbox', label: 'Protocolo / Entrega' },
  { icon: 'chart-line', label: 'Execução' },
  { icon: 'check', label: 'Encerramento' },
]

export const TEAM_MEMBERS = CASE_TEAM.map(({ className, initials }) => ({
  className,
  initials,
}))
