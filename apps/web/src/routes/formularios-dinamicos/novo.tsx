import { createFileRoute } from '@tanstack/react-router'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { DynamicFormEditorPage } from '@/ui/legal-catalog/widgets/pages/dynamic-form-editor-page'

export const Route = createFileRoute('/formularios-dinamicos/novo')({
  beforeLoad: requireAdminMiddleware,
  ssr: false,
  component: NewDynamicFormRoute,
})

function NewDynamicFormRoute() {
  return (
    <AppLayout>
      <DynamicFormEditorPage mode='create' />
    </AppLayout>
  )
}
