import { createFileRoute } from '@tanstack/react-router'

import { MeusCasos } from '@/ui/identity/widgets/pages/client-page/my-cases'

export const Route = createFileRoute('/cliente/meus-casos/')({
  component: MeusCasos,
})
