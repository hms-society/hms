import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Home, FolderKanban, Users, Menu, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { NavbarPill } from '#/ui/engagement/widgets/components/navbar-pill'

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
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar na Esquerda */}
      <aside
        className={`flex flex-col items-start bg-hms-sidebar-foreground border border-black/10 rounded-[2px] shadow-md transition-all duration-300 shrink-0 ${
          isCollapsed ? 'w-[72px] py-6 justify-between h-screen sticky top-0' : 'w-[239px] h-screen sticky top-0'
        }`}
      >
        {/* Topo do Sidebar */}
        <div className="w-full flex flex-col items-start px-4 pt-4 gap-6">
          {/* Logo e Botão de Retrair */}
          <div className={`flex items-center w-full ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-serif font-bold text-white text-lg tracking-wide">HMS</span>
                <span className="text-[10px] text-white/60 font-sans tracking-widest uppercase">Advocacia</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isCollapsed ? "Expandir" : "Retrair"}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Divisor */}
          <div className="w-full h-px bg-white/10" />

          {/* Itens do Menu */}
          <nav className="flex flex-col w-full gap-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activePath === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path as any}
                  onClick={() => setActivePath(item.path)}
                  className={`flex items-center gap-3 w-full py-2.5 rounded-md font-medium transition-all duration-200 outline-none cursor-pointer ${
                    isCollapsed ? 'justify-center px-0' : 'px-3'
                  } ${
                    isActive
                      ? 'bg-white/10 text-white shadow-xs border-l-4 border-brand-accent'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-accent' : ''}`} />
                  {!isCollapsed && <span className="text-sm">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Rodapé do Sidebar (Sair / Logout) */}
        <div className="w-full px-4 pb-4 mt-auto">
          <div className="w-full h-px bg-white/10 mb-4" />
          <button
            type="button"
            className={`flex items-center gap-3 w-full py-2.5 rounded-md font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
            title={isCollapsed ? "Sair" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="text-sm">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal à Direita */}
      <main className="flex-1 flex flex-col relative min-h-screen">
        {/* Navbar Pill Flutuante */}
        <NavbarPill />

        {/* Área de visualização do conteúdo */}
        <div className="flex-1 p-8 pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
