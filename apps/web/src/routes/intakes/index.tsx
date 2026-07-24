import { createFileRoute } from '@tanstack/react-router'

import { IntakesPage } from '#/ui/intake/widgets/pages/intakes'

export const Route = createFileRoute('/intakes/')({
  component: IntakesPage,
})
