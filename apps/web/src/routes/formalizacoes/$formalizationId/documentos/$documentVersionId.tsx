import { createFileRoute } from '@tanstack/react-router'

import { FormalizationDocumentReviewPage } from '@/ui/formalization/widgets/pages/formalization-page/formalization-document-review-page'

export const Route = createFileRoute(
  '/formalizacoes/$formalizationId/documentos/$documentVersionId',
)({
  component: FormalizationDocumentReviewRoute,
})

function FormalizationDocumentReviewRoute() {
  const { formalizationId, documentVersionId } = Route.useParams()
  return (
    <FormalizationDocumentReviewPage
      formalizationId={formalizationId}
      documentVersionId={documentVersionId}
    />
  )
}
