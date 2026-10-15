import { createFileRoute } from '@tanstack/react-router'

import { requireCaseCreatorMiddleware } from '@/middlewares/require-case-creator-middleware'
import { CreateCasePage } from '@/ui/identity/widgets/pages/lawyer-page/create-case-page'
import { RouteAccessError } from '@/ui/shared/widgets/components/route-access-error'

export const Route = createFileRoute('/advogado/meus-casos/novo-caso')({
  beforeLoad: requireCaseCreatorMiddleware,
  component: CreateCasePage,
  errorComponent: RouteAccessError,
})
