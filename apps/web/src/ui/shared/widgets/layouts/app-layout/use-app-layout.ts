import { useState } from 'react'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'
import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'

export function useAppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = useUrlPathname()

  function handleSidebarToggle(isCollapsed: boolean) {
    setIsSidebarCollapsed(isCollapsed)
  }

  return {
    pathname,
    isSidebarCollapsed,
    sidebarItems: SIDEBAR_ITEMS[CollaboratorProfile.Attendant],
    handleSidebarToggle,
  }
}
