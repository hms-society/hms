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
  { label: 'Consultas', route: 'consultations', icon: 'monitor' },
  { label: 'Minha agenda', route: 'schedule', icon: 'calendar' },
  { label: 'Meus casos', route: 'cases', icon: 'briefcase' },
  { label: 'Configurações', route: 'settings', icon: 'settings' },
]

export const SIDEBAR_ITEMS: SidebarItems = {
  [CollaboratorProfile.Admin]: [
    { label: 'Dashboard', route: 'home', icon: 'layout-dashboard' },
    { label: 'Intakes', route: 'intakes', icon: 'inbox' },
    { label: 'Casos', route: 'cases', icon: 'briefcase-business' },
    { label: 'Agendas', route: 'schedules', icon: 'calendar-days' },
    { label: 'Colaboradores', route: 'collaborators', icon: 'users' },
    { label: 'Clientes', route: 'clients', icon: 'user' },
    { label: 'Terceiros', route: 'thirdParties', icon: 'building' },
    { label: 'Configurações', route: 'settings', icon: 'settings' },
    { label: 'Financeiro', route: 'finance', icon: 'coins' },
    { label: 'Indicadores', route: 'indicators', icon: 'chart-line' },
    { label: 'Auditoria', route: 'audit', icon: 'list-search' },
  ],
  [CollaboratorProfile.Attendant]: [
    { label: 'Dashboard', route: 'home', icon: 'layout-dashboard' },
    { label: 'Intakes', route: 'intakes', icon: 'file-text' },
    { label: 'Agenda de consultas', route: 'schedules', icon: 'calendar' },
    { label: 'Clientes', route: 'clients', icon: 'users' },
    { label: 'Configurações', route: 'settings', icon: 'settings' },
  ],
  [CollaboratorProfile.Lawyer]: LAWYER_SIDEBAR_ITEMS,
  [CollaboratorProfile.Paralegal]: LAWYER_SIDEBAR_ITEMS,
  [CollaboratorProfile.Supervisor]: LAWYER_SIDEBAR_ITEMS,
}
