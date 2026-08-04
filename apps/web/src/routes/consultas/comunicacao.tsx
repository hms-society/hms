import { createFileRoute } from '@tanstack/react-router'

import { LawyerCommunicationPage } from '@/ui/identity/widgets/pages/lawer-page/communication'

export const Route = createFileRoute('/consultas/comunicacao')({
  component: LawyerCommunicationPage,
})
