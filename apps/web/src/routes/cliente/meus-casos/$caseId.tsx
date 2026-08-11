import { createFileRoute } from '@tanstack/react-router'
import { CaseDetails } from '@/ui/identity/widgets/pages/client-page/widgets/case-details'

export const Route = createFileRoute('/cliente/meus-casos/$caseId')({
  component: CaseDetails,
})
