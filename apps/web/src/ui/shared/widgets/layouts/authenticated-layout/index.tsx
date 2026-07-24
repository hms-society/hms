import { useLocation } from '@tanstack/react-router'
import { FileText, FolderKanban, Home, Users } from 'lucide-react'
import { useState } from 'react'
import { NavbarPill } from '#/ui/engagement/widgets/components/navbar-pill'
import { Sidebar } from '#/ui/engagement/widgets/components/sidebar'

export interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = useLocation({ select: (location) => location.pathname })

  const sidebarItems = [
    { label: 'Início', path: '/home', icon: Home },
    { label: 'Intakes', path: '/intakes', icon: FileText },
    { label: 'Casos', path: '/cases', icon: FolderKanban },
    { label: 'Clientes', path: '/clients', icon: Users },
  ]

  return (
    <div className='flex min-h-screen bg-background text-foreground font-sans'>
      {/* Sidebar na Esquerda */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activePath={pathname}
        sidebarItems={sidebarItems}
      />

      {/* Conteúdo Principal à Direita */}
      <main className='relative flex min-h-screen min-w-0 flex-1 flex-col'>
        {/* Navbar Pill Flutuante */}
        <NavbarPill />

        {/* Área de visualização do conteúdo */}
        <div className='flex-1 px-4 pt-6 pb-8 sm:px-8'>{children}</div>
      </main>
    </div>
  )
}
