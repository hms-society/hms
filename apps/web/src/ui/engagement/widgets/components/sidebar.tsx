import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, LogOut, type LucideIcon } from 'lucide-react'

export interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (isCollapsed: boolean) => void
  activePath: string
  setActivePath: (activePath: string) => void
  sidebarItems: {
    label: string
    path: string
    icon: LucideIcon
  }[]
}

export const Sidebar = ({
  isCollapsed,
  setIsCollapsed,
  activePath,
  setActivePath,
  sidebarItems,
}: SidebarProps) => {
  return (
    <aside
      className={`flex flex-col items-start bg-hms-sidebar-foreground border border-black/10 rounded-[2px] shadow-md transition-all duration-300 shrink-0 ${
        isCollapsed
          ? 'w-[72px] py-6 justify-between h-screen sticky top-0'
          : 'w-[239px] h-screen sticky top-0'
      }`}
    >
      {/* Topo do Sidebar */}
      <div className='w-full flex flex-col items-start px-4 pt-4 gap-6'>
        {/* Logo e Botão de Retrair */}
        <div
          className={`relative flex w-full items-center ${isCollapsed ? 'flex-col gap-3 justify-center' : 'justify-center min-h-[64px]'}`}
        >
          {!isCollapsed ? (
            <>
              <div className='flex flex-col bg-white rounded p-4 items-center justify-center w-24'>
                <span className='font-serif font-bold text-brand text-lg tracking-wide'>
                  HMS
                </span>
                <hr className='h-1 w-full bg-brand-accent rounded-full mt-1' />
              </div>
              <button
                type='button'
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer'
                title='Retrair'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>
            </>
          ) : (
            <button
              type='button'
              onClick={() => setIsCollapsed(!isCollapsed)}
              className='p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer'
              title='Expandir'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          )}
        </div>

        {/* Divisor */}
        <div className='w-full h-0.5 bg-white' />

        {/* Itens do Menu */}
        <nav className='flex flex-col w-full gap-2'>
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
                    ? 'bg-highlight-vivid/20 text-white shadow-xs border-l-4 border-highlight-vivid'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-highlight-vivid' : ''}`}
                />
                {!isCollapsed && <span className='text-sm'>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Rodapé do Sidebar (Sair / Logout) */}
      <div className='w-full px-4 pb-4 mt-auto'>
        <div className='w-full h-px bg-white/10 mb-4' />
        <button
          type='button'
          className={`flex items-center gap-3 w-full py-2.5 rounded-md font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : 'px-3'
          }`}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut className='w-5 h-5 shrink-0' />
          {!isCollapsed && <span className='text-sm'>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
