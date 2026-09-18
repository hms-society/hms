import { createFileRoute } from '@tanstack/react-router'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const Route = createFileRoute('/formularios-dinamicos/$dynamicFormId')({
  beforeLoad: requireAdminMiddleware,
  ssr: false,
  component: DynamicFormRoute,
})

function DynamicFormRoute() {
  const { dynamicFormId } = Route.useParams()
  const isValidId = UUID_PATTERN.test(dynamicFormId)

  return (
    <AppLayout>
      <main className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
        <Card>
          <CardHeader>
            <h1 className='font-serif text-3xl font-semibold text-brand'>
              Editar formulário
            </h1>
            <p className='text-muted-foreground'>
              {isValidId
                ? 'O editor de formulários dinâmicos estará disponível em breve.'
                : 'O identificador do formulário é inválido.'}
            </p>
          </CardHeader>
          <CardContent>
            <Anchor
              route='dynamicForms'
              className='inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground'
            >
              Voltar para formulários
            </Anchor>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  )
}
