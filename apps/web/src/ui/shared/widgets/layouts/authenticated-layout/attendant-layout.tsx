import { useState } from 'react'
import { LayoutDashboard, ClipboardList, Calendar, Briefcase, MessageSquare, MonitorCheck } from 'lucide-react'
import { NavbarPill } from '#/ui/engagement/widgets/components/navbar-pill'
import { Sidebar } from '#/ui/engagement/widgets/components/sidebar'
import { useRouterState } from '@tanstack/react-router'

export interface AttendantLayoutProps {
  children: React.ReactNode
}

export const AttendantLayout = ({ children }: AttendantLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const activePath = useRouterState({
  select: (state) => state.location.pathname,
})
 
  const sidebarItems = [
    { label: 'Dashboard',      path: '/atendente/dashboard',    icon: LayoutDashboard },
    { label: 'Meus intakes',   path: '/intakes',      icon: ClipboardList },
    { label: 'Consultas',      path: '/atendente/consultas',    icon: MonitorCheck },
    { label: 'Minha agenda',   path: '/agenda',       icon: Calendar },
    { label: 'Meus casos',     path: '/casos',        icon: Briefcase },
    { label: 'Comunicação',    path: '/comunicacao',  icon: MessageSquare },
  ]

  return (
    <div className='flex min-h-screen bg-background text-foreground font-sans'>
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activePath={activePath}
        sidebarItems={sidebarItems}
        />

      <main className='flex-1 flex flex-col relative min-h-screen'>
        <NavbarPill />
        <div className='flex-1 p-8 pt-6'>{children}</div>
      </main>
    </div>
  )
}