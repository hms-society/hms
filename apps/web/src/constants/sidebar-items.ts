import type { IconName } from '@/ui/shared/widgets/components/icon/types/icon-name'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'
import type { RouteName } from './routes'

export type SidebarItem = {
  label: string
  route: RouteName
  icon: IconName
}

export type SidebarItems = {
  [key in CollaboratorProfile]: SidebarItem[]
}

const LAWYER_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', route: 'home', icon: 'layout-dashboard' },
  { label: 'Meus intakes', route: 'intakes', icon: 'file-text' },
  { label: 'Consultas', route: 'lawyerConsultations', icon: 'monitor' },
]

const ATTENDANT_SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard', route: 'attendantDashboard', icon: 'layout-dashboard' },
  { label: 'Intakes', route: 'intakes', icon: 'file-text' },
  { label: 'Consultas', route: 'attendantConsultations', icon: 'monitor' },
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
  ],
  [CollaboratorProfile.Attendant]: ATTENDANT_SIDEBAR_ITEMS,
  [CollaboratorProfile.Lawyer]: LAWYER_SIDEBAR_ITEMS,
  [CollaboratorProfile.Paralegal]: LAWYER_SIDEBAR_ITEMS,
  [CollaboratorProfile.Supervisor]: LAWYER_SIDEBAR_ITEMS,
  [CollaboratorProfile.Client]: CLIENT_SIDEBAR_ITEMS,
}
