import { useState } from 'react'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'
import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'

export function useAppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = useUrlPathname()
  const { user } = useAuthContext()

  function handleSidebarToggle(isCollapsed: boolean) {
    setIsSidebarCollapsed(isCollapsed)
  }

  const role = (user?.role as CollaboratorProfile) || CollaboratorProfile.Attendant
  const sidebarItems = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS[CollaboratorProfile.Attendant]

  return {
    pathname,
    isSidebarCollapsed,
    sidebarItems,
    handleSidebarToggle,
  }
}
