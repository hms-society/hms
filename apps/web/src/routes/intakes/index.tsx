import { createFileRoute } from '@tanstack/react-router'

import { parseIntakeListSearch } from '@/ui/intake/widgets/pages/intakes-page/intakes-page-search'
import { IntakesPage } from '@/ui/intake/widgets/pages/intakes-page'

export const Route = createFileRoute('/intakes/')({
  validateSearch: parseIntakeListSearch,
  component: IntakesPage,
})
