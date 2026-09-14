import { createFileRoute } from '@tanstack/react-router'
import { dynamicFormAdministrationSearchSchema } from '@hms/validation/legal-catalog'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { DynamicFormsPage } from '@/ui/legal-catalog/widgets/pages/dynamic-forms-page'

export const Route = createFileRoute('/formularios-dinamicos/')({
  beforeLoad: requireAdminMiddleware,
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => {
    const result = dynamicFormAdministrationSearchSchema.safeParse(search)
    return result.success ? result.data : dynamicFormAdministrationSearchSchema.parse({})
  },
  component: DynamicFormsRoute,
})

function DynamicFormsRoute() {
  return (
    <AppLayout>
      <DynamicFormsPage />
    </AppLayout>
  )
}
