import { useState } from 'react'

import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { useUrlPathname } from '@/ui/shared/hooks/use-url-pathname'
import { SIDEBAR_ITEMS } from '@/constants/sidebar-items'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'

export function useAppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = useUrlPathname()
  const { currentCollaborator } = useCurrentCollaboratorQuery()

  function handleSidebarToggle(isCollapsed: boolean) {
    setIsSidebarCollapsed(isCollapsed)
  }

  return {
    pathname,
    isSidebarCollapsed,
    sidebarItems:
      SIDEBAR_ITEMS[currentCollaborator?.profile ?? CollaboratorProfile.Attendant],
    handleSidebarToggle,
  }
}
