import { createFileRoute } from '@tanstack/react-router'

import { NewIntakePage } from '@/ui/intake/widgets/pages/new-intake-page'

export const Route = createFileRoute('/intakes/novo')({
  component: NewIntakePage,
})
