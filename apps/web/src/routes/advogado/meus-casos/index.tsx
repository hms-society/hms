import { createFileRoute } from '@tanstack/react-router'

import { LawyerCasesListPage } from '@/ui/identity/widgets/pages/lawyer-page/my-cases-list-page'

export const Route = createFileRoute('/advogado/meus-casos/')({
  component: LawyerCasesListPage,
})
