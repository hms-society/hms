import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/formalizacoes/$formalizationId/')({
  component: FormalizationRoute,
})

function FormalizationRoute() {
  const { formalizationId } = Route.useParams()
  return <main data-formalization-id={formalizationId}>Formalização</main>
}
