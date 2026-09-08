import { createFileRoute } from '@tanstack/react-router'

import { CreateCasePage } from '@/ui/identity/widgets/pages/lawyer-page/create-case-page'

export const Route = createFileRoute('/advogado/meus-casos/novo-caso')({
  component: CreateCasePage,
})
