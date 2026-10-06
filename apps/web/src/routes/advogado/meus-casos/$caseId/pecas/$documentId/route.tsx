import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireAuthMiddleware } from '@/middlewares/require-auth-middleware'

export const Route = createFileRoute('/advogado/meus-casos/$caseId/pecas/$documentId')({
  beforeLoad: requireAuthMiddleware,
  component: () => <Outlet />,
  ssr: false,
})
