import { useState } from 'react'
import { Home, FolderKanban, Users } from 'lucide-react'
import { NavbarPill } from '#/ui/engagement/widgets/components/navbar-pill'
import { Sidebar } from '#/ui/engagement/widgets/components/sidebar'

export interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

export const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activePath, setActivePath] = useState('/home')

  const sidebarItems = [
    { label: 'Início', path: '/home', icon: Home },
    { label: 'Casos', path: '/cases', icon: FolderKanban },
    { label: 'Clientes', path: '/clients', icon: Users },
  ]

  return (
    <div className='flex min-h-screen bg-background text-foreground font-sans'>
      {/* Sidebar na Esquerda */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        activePath={activePath}
        setActivePath={setActivePath}
        sidebarItems={sidebarItems}
      />

      {/* Conteúdo Principal à Direita */}
      <main className='flex-1 flex flex-col relative min-h-screen'>
        {/* Navbar Pill Flutuante */}
        <NavbarPill />

        {/* Área de visualização do conteúdo */}
        <div className='flex-1 p-8 pt-6'>{children}</div>
      </main>
    </div>
  )
}
