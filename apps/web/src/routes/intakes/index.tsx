import { createFileRoute } from '@tanstack/react-router'

import { IntakesPage } from '@/ui/intake/widgets/pages/intakes-page'
import { parseIntakeSearch } from '@/ui/intake/widgets/pages/intakes-page/intakes-page-search'
import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'

export const Route = createFileRoute('/intakes/')({
  beforeLoad: requireAuthMiddleware,
  component: IntakesPage,
  validateSearch: (search) => {
    const parsedSearch = parseIntakeSearch(search)

    return {
      ...parsedSearch,
      search: parsedSearch.search ?? undefined,
      status: parsedSearch.status ?? undefined,
      responsibleId: parsedSearch.responsibleId ?? undefined,
      origin: parsedSearch.origin ?? undefined,
      contactChannel: parsedSearch.contactChannel ?? undefined,
      registeredFrom: parsedSearch.registeredFrom ?? undefined,
      registeredTo: parsedSearch.registeredTo ?? undefined,
      page: parsedSearch.page === 1 ? undefined : parsedSearch.page,
      pageSize: parsedSearch.pageSize === 20 ? undefined : parsedSearch.pageSize,
    }
  },
  ssr: false,
})
