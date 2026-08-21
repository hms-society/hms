import type { IconName } from '@/ui/shared/widgets/components/icon/types/icon-name'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import type { RouteName } from './routes'

export type SidebarItem = {
  label: string
  route: RouteName
  icon: IconName
  badgeCount?: number
}

export type SidebarItems = {
  [key in CollaboratorProfile]: SidebarItem[]
}

const LAWYER_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', route: 'home', icon: 'layout-dashboard' },
  { label: 'Meus intakes', route: 'intakes', icon: 'file-text' },
  { label: 'Consultas', route: 'lawyerConsultations', icon: 'monitor' },
  {
    label: 'Central de Comunicação',
    route: 'lawyerCommunication',
    icon: 'message-square',
  },
  { label: 'Minha Agenda', route: 'lawyerSchedule', icon: 'calendar' },
  { label: 'Clientes', route: 'clients', icon: 'users' },
]

const ATTENDANT_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Intakes', route: 'intakes', icon: 'file-text' },
  { label: 'Consultas', route: 'attendantConsultations', icon: 'monitor' },
  { label: 'Clientes', route: 'clients', icon: 'users' },
]

const PARALEGAL_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Meus Casos', route: 'paralegalCases', icon: 'briefcase' },
  { label: 'Documentos', route: 'paralegalDocuments', icon: 'file-text' },
  // { label: 'Caixa de Triagem', route: 'paralegalTriage', icon: 'inbox', badgeCount: 14 },
  {
    label: 'Central de Comunicação',
    route: 'paralegalCommunication',
    icon: 'message-square',
  },
  { label: 'Caixa de Documentos', route: 'documentInbox', icon: 'inbox' },
]

const CLIENT_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Meus Casos', route: 'clientMyCases', icon: 'file-text' },
  { label: 'Mensagens', route: 'clientMessages', icon: 'message-square' },
  { label: 'Privacidade & LGPD', route: 'clientPrivacy', icon: 'shield-check' },
]
export const SIDEBAR_ITEMS: SidebarItems = {
  [CollaboratorProfile.Admin]: [
    { label: 'Dashboard', route: 'home', icon: 'layout-dashboard' },
    { label: 'Intakes', route: 'intakes', icon: 'inbox' },
    { label: 'Consultas', route: 'attendantConsultations', icon: 'monitor' },
    { label: 'Colaboradores', route: 'collaborators', icon: 'users' },
    { label: 'Documentos', route: 'documentSpecifications', icon: 'file-text' },
    { label: 'Caixa de Documentos', route: 'documentInbox', icon: 'inbox' },
  ],
  [CollaboratorProfile.Attendant]: ATTENDANT_SIDEBAR_ITEMS,
  [CollaboratorProfile.Lawyer]: LAWYER_SIDEBAR_ITEMS,
  [CollaboratorProfile.Paralegal]: PARALEGAL_SIDEBAR_ITEMS,
  [CollaboratorProfile.Supervisor]: LAWYER_SIDEBAR_ITEMS,
  [CollaboratorProfile.Client]: CLIENT_SIDEBAR_ITEMS,
}
