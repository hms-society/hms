import { Link } from '@tanstack/react-router'

import type { IconName } from '@/ui/shared/widgets/components/icon'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type SidebarProps = {
  isCollapsed: boolean
  onToggle: (isCollapsed: boolean) => void
  activePath: string
  sidebarItems: {
    label: string
    path: string
    icon: IconName
  }[]
}

export const Sidebar = ({
  isCollapsed,
  onToggle,
  activePath,
  sidebarItems,
}: SidebarProps) => {
  return (
    <aside
      className={`hidden lg:flex flex-col items-start bg-hms-sidebar-foreground border border-black/10 rounded-[2px] shadow-md transition-all duration-300 shrink-0 ${
        isCollapsed
          ? 'w-[72px] py-6 justify-between h-screen sticky top-0'
          : 'w-[239px] h-screen sticky top-0'
      }`}
    >
      <div className='w-full flex flex-col items-start px-4 pt-4 gap-6'>
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
                onClick={() => onToggle(!isCollapsed)}
                className='absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer'
                title='Retrair'
              >
                <Icon name='chevron-left' className='w-5 h-5' />
              </button>
            </>
          ) : (
            <button
              type='button'
              onClick={() => onToggle(!isCollapsed)}
              className='p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer'
              title='Expandir'
            >
              <Icon name='chevron-right' className='w-5 h-5' />
            </button>
          )}
        </div>

        <div className='w-full h-0.5 bg-white' />

        <nav className='flex flex-col w-full gap-2'>
          {sidebarItems.map((item) => {
            const isActive =
              activePath === item.path ||
              (item.path !== '/home' && activePath.startsWith(`${item.path}/`))

            return (
              <Link
                key={item.path}
                to={item.path as any}
                className={`flex items-center gap-3 w-full py-2.5 rounded-md font-medium transition-all duration-200 outline-none cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-highlight-vivid/20 text-white ring-1 ring-inset ring-highlight-vivid/40'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  name={item.icon}
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
          <Icon name='log-out' className='w-5 h-5 shrink-0' />
          {!isCollapsed && <span className='text-sm'>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
