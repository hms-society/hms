import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/formalizacoes/$formalizationId/configuracao-envio/',
)({
  component: FormalizationSendingConfigurationRoute,
})

function FormalizationSendingConfigurationRoute() {
  const { formalizationId } = Route.useParams()
  return <main data-formalization-id={formalizationId}>Configuração de envio</main>
}
