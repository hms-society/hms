import { createFileRoute } from '@tanstack/react-router'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { DynamicFormEditorPage } from '@/ui/legal-catalog/widgets/pages/dynamic-form-editor-page'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const Route = createFileRoute('/formularios-dinamicos/$dynamicFormId')({
  beforeLoad: requireAdminMiddleware,
  ssr: false,
  component: DynamicFormRoute,
})

function DynamicFormRoute() {
  const { dynamicFormId } = Route.useParams()
  return (
    <AppLayout>
      <DynamicFormEditorPage
        mode='edit'
        dynamicFormId={dynamicFormId}
        isValidId={UUID_PATTERN.test(dynamicFormId)}
      />
    </AppLayout>
  )
}
