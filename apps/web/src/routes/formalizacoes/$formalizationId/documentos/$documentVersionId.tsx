import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/formalizacoes/$formalizationId/documentos/$documentVersionId',
)({
  component: FormalizationDocumentReviewRoute,
})

function FormalizationDocumentReviewRoute() {
  const { formalizationId, documentVersionId } = Route.useParams()
  return (
    <main data-document-version-id={documentVersionId}>
      Revisão de documento da formalização {formalizationId}
    </main>
  )
}
