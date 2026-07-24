import { createFileRoute } from '@tanstack/react-router'

import { NewIntakePage } from '#/ui/intake/widgets/pages/new-intake'

export const Route = createFileRoute('/intakes/new')({
  component: NewIntakePage,
})
