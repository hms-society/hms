import { createFileRoute } from '@tanstack/react-router'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { DynamicFormEditorPage } from '@/ui/legal-catalog/widgets/pages/dynamic-form-editor-page'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'

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
        isValidId={isValidDynamicFormId(dynamicFormId)}
      />
    </AppLayout>
  )
}

function isValidDynamicFormId(dynamicFormId: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    dynamicFormId,
  )
}
