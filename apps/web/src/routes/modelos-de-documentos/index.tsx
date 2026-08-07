import { createFileRoute } from '@tanstack/react-router'
import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '@hms/core/document-production/domain/structures'
import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { DocumentSpecificationsPage } from '@/ui/document-production/widgets/pages/document-specifications-page'

export const Route = createFileRoute('/modelos-de-documentos/')({
  beforeLoad: requireAdminMiddleware,
  ssr: false,
  validateSearch: parseDocumentSpecificationsSearch,
  component: RouteComponent,
})

export function parseDocumentSpecificationsSearch(search: Record<string, unknown>) {
  return {
    search: typeof search.search === 'string' ? search.search.trim() : '',
    legalAreaId: parseOptionalUuid(search.legalAreaId),
    legalTopicId: parseOptionalUuid(search.legalTopicId),
    moment: Object.values(DocumentGenerationMoment).includes(search.moment as never)
      ? (search.moment as DocumentGenerationMoment)
      : undefined,
    status: Object.values(DocumentSpecificationStatus).includes(search.status as never)
      ? (search.status as DocumentSpecificationStatus)
      : undefined,
    page: parsePositive(search.page, 1),
    pageSize: parsePageSize(search.pageSize),
  }
}

function parseOptionalUuid(value: unknown) {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : undefined
}

function parsePositive(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
function parsePageSize(value: unknown) {
  const parsed = parsePositive(value, 20)
  return parsed <= 100 ? parsed : 20
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function RouteComponent() {
  return (
    <AppLayout>
      <DocumentSpecificationsPage />
    </AppLayout>
  )
}
