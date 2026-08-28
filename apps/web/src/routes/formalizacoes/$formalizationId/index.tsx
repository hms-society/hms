import { createFileRoute } from '@tanstack/react-router'

import { FormalizationPage } from '@/ui/formalization/widgets/pages/formalization-page'

export const Route = createFileRoute('/formalizacoes/$formalizationId/')({
  component: FormalizationRoute,
})

function FormalizationRoute() {
  const { formalizationId } = Route.useParams()
  return <FormalizationPage formalizationId={formalizationId} />
}
