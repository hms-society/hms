import { createFileRoute } from '@tanstack/react-router'

import { SigningGatewayPage } from '@/ui/formalization/widgets/pages/signing-gateway-page'

export const Route = createFileRoute('/assinaturas/acesso/')({
  component: SigningGatewayPage,
  ssr: false,
})
