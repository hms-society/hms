import { createFileRoute } from '@tanstack/react-router'

import { FormalizationSendingConfigurationPage } from '@/ui/formalization/widgets/pages/formalization-sending-configuration-page'

export const Route = createFileRoute(
  '/formalizacoes/$formalizationId/configuracao-envio/',
)({
  component: FormalizationSendingConfigurationRoute,
  ssr: false,
})

function FormalizationSendingConfigurationRoute() {
  const { formalizationId } = Route.useParams()
  return <FormalizationSendingConfigurationPage formalizationId={formalizationId} />
}
