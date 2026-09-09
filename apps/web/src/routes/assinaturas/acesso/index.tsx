import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/assinaturas/acesso/')({
  component: SigningGatewayRoute,
  ssr: false,
})

function SigningGatewayRoute() {
  return <main>Fluxo de assinatura</main>
}
