import { createFileRoute } from '@tanstack/react-router'

import { FormalizationSendingConfiguration } from '@/ui/formalization/widgets/pages/formalization-sending-configuration'

export const Route = createFileRoute(
  '/formalizacoes/$formalizationId/configuracao-envio/',
)({
  component: FormalizationSendingConfigurationRoute,
})

function FormalizationSendingConfigurationRoute() {
  const { formalizationId } = Route.useParams()
  return <FormalizationSendingConfiguration formalizationId={formalizationId} />
}
