import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { requireAdminOrSupervisorMiddleware } from '@/middlewares/require-admin-or-supervisor-middleware'
import { ThirdPartyRegisterDialog } from '@/ui/identity/widgets/components/third-party-register-dialog'
import { ThirdPartiesPage } from '@/ui/identity/widgets/pages/third-parties-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

export const Route = createFileRoute('/terceiros/')({
  beforeLoad: requireAdminOrSupervisorMiddleware,
  component: ThirdPartiesRoute,
  ssr: false,
})

function ThirdPartiesRoute() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  return (
    <AppLayout>
      <ThirdPartiesPage onCreateThirdParty={() => setIsDialogOpen(true)} />
      <ThirdPartyRegisterDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </AppLayout>
  )
}
