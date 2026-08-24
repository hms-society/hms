import { createFileRoute } from '@tanstack/react-router'
import { CaseDetails } from '@/ui/identity/widgets/pages/client-details-page/my-cases-tab/case-details'

export const Route = createFileRoute('/cliente/meus-casos/$caseId')({
  component: CaseDetails,
})
