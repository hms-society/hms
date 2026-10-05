import { ROUTES } from '@/constants/routes'
import type { SidebarItem } from '@/constants/sidebar-items'
import { useCommunication } from '@/ui/shared/contexts/communication-context'
import { useSignOutAction } from '@/ui/shared/hooks/use-sign-out-action'
import type { SidebarProps } from './index'

export function useSidebar(props: SidebarProps) {
  const { activePath, isCollapsed, onToggle, sidebarItems } = props
  const { mutate: signOut, isPending } = useSignOutAction()
  const { hasUnread } = useCommunication()
  const normalizedActivePath = activePath.replace(/\/$/, '') || '/'
  const activeItem = sidebarItems.reduce<SidebarItem | undefined>((current, item) => {
    const routePath = ROUTES[item.route]
    const normalizedRoutePath = routePath.replace(/\/$/, '') || '/'
    const matches =
      normalizedActivePath === normalizedRoutePath ||
      (normalizedRoutePath !== ROUTES.home &&
        normalizedActivePath.startsWith(`${normalizedRoutePath}/`))

    if (!matches) return current
    if (!current) return item

    const currentPath = ROUTES[current.route].replace(/\/$/, '') || '/'
    return normalizedRoutePath.length > currentPath.length ? item : current
  }, undefined)

  function handleToggle() {
    onToggle(!isCollapsed)
  }

  function handleSignOut() {
    signOut()
  }

  function isItemActive(route: SidebarItem['route']) {
    return activeItem?.route === route
  }

  return {
    hasUnread,
    isPending,
    handleToggle,
    handleSignOut,
    isItemActive,
  }
}
