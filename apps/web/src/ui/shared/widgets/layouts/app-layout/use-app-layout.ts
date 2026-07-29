import { useState } from 'react'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'
import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'

export function useAppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = useUrlPathname()
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const { user } = useAuthContext()

  function handleSidebarToggle(isCollapsed: boolean) {
    setIsSidebarCollapsed(isCollapsed)
  }

  const role =
    currentCollaborator?.profile ||
    (user?.role as CollaboratorProfile) ||
    CollaboratorProfile.Attendant
  const sidebarItems =
    SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS[CollaboratorProfile.Attendant]

  return {
    pathname,
    isSidebarCollapsed,
    sidebarItems,
    handleSidebarToggle,
  }
}
