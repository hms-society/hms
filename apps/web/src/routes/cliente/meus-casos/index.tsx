import { createFileRoute } from '@tanstack/react-router'

import { MyCasesTab } from '@/ui/identity/widgets/pages/client-details-page/my-cases-tab'

export const Route = createFileRoute('/cliente/meus-casos/')({
  component: MyCasesTab,
})
