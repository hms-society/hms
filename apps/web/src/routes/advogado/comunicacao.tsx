import { createFileRoute } from '@tanstack/react-router'

import { LawyerCommunicationPage } from '@/ui/identity/widgets/pages/lawer-page/communication'

export const Route = createFileRoute('/advogado/comunicacao')({
  component: LawyerCommunicationPage,
})
