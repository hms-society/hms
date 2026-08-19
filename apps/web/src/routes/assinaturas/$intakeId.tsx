import { createFileRoute } from '@tanstack/react-router'
import { SignatureTrackingPage } from '@/ui/identity/widgets/pages/paralegal-page/assinatura/signature-tracking-page'

export const Route = createFileRoute('/assinaturas/$intakeId')({
  validateSearch: (search: Record<string, unknown>) => ({
    consultationId:
      typeof search.consultationId === 'string' ? search.consultationId : undefined,
  }),
  component: RouteComponent,
})

function RouteComponent() {
  const { intakeId } = Route.useParams()
  const { consultationId } = Route.useSearch()

  return <SignatureTrackingPage intakeId={intakeId} consultationId={consultationId} />
}
