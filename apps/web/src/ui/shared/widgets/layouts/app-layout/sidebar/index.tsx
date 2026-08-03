import { ROUTES } from '@/constants/routes'
import type { SidebarItem } from '@/constants/sidebar-items'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useSignOutAction } from './use-sign-out-action'

export type SidebarProps = {
  isCollapsed: boolean
  onToggle: (isCollapsed: boolean) => void
  activePath: string
  sidebarItems: SidebarItem[]
}

export const Sidebar = ({
  isCollapsed,
  activePath,
  sidebarItems,
  onToggle,
}: SidebarProps) => {
  const { mutate: signOut, isPending } = useSignOutAction()
  const normalizedActivePath = activePath.replace(/\/$/, '') || '/'

  return (
    <aside
      aria-label='Navegação principal'
      className={`sticky top-0 z-20 hidden h-screen shrink-0 flex-col items-start border-r border-white/15 bg-hms-sidebar-foreground transition-all duration-300 lg:flex ${
        isCollapsed ? 'w-16 py-6' : 'w-[200px]'
      }`}
    >
      <div className='flex w-full flex-col items-start gap-4 px-2 pt-3'>
        <div
          className={`relative flex w-full items-center ${isCollapsed ? 'flex-col justify-center gap-3' : 'min-h-16 justify-center'}`}
        >
          {!isCollapsed ? (
            <>
              <div className='flex h-16 w-24 flex-col items-center justify-center rounded-md bg-white'>
                <span className='font-serif text-lg font-bold tracking-wide text-brand'>
                  HMS
                </span>
                <hr className='mt-1 h-1 w-16 rounded-full bg-brand-accent' />
              </div>
              <button
                type='button'
                onClick={() => onToggle(true)}
                className='absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-highlight-vivid'
                title='Retrair'
                aria-label='Retrair menu lateral'
              >
                <Icon name='chevron-left' className='w-5 h-5' />
              </button>
            </>
          ) : (
            <button
              type='button'
              onClick={() => onToggle(false)}
              className='cursor-pointer rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-highlight-vivid'
              title='Expandir'
              aria-label='Expandir menu lateral'
            >
              <Icon name='chevron-right' className='w-5 h-5' />
            </button>
          )}
        </div>

        <div className='h-px w-full bg-white/25' />

        <nav className='flex w-full flex-col gap-1' aria-label='Seções'>
          {sidebarItems.map((item) => {
            const routePath = ROUTES[item.route]
            const normalizedRoutePath = routePath.replace(/\/$/, '') || '/'
            const isActive =
              normalizedActivePath === normalizedRoutePath ||
              (normalizedRoutePath !== ROUTES.home &&
                normalizedActivePath.startsWith(`${normalizedRoutePath}/`))

            return (
              <Anchor
                key={item.route}
                route={item.route}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-md py-2.5 font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-highlight-vivid ${
                  isCollapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-highlight-vivid/20 text-white ring-1 ring-inset ring-highlight-vivid/40'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                title={isCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  name={item.icon}
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-highlight-vivid' : ''}`}
                />
                {!isCollapsed && <span className='text-sm'>{item.label}</span>}
              </Anchor>
            )
          })}
        </nav>
      </div>

      <div className='w-full px-4 pb-4 mt-auto'>
        <div className='mb-3 h-px w-full bg-white/15' />
        <button
          type='button'
          onClick={() => signOut()}
          disabled={isPending}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-md py-2.5 font-medium text-white/70 transition-all duration-200 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-highlight-vivid ${
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
