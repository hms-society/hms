import { createFileRoute } from '@tanstack/react-router'

import { requireAdminMiddleware } from '@/middlewares/require-admin-middleware'
import { AppLayout } from '@/ui/shared/widgets/layouts/app-layout'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'

export const Route = createFileRoute('/formularios-dinamicos/novo')({
  beforeLoad: requireAdminMiddleware,
  ssr: false,
  component: NewDynamicFormRoute,
})

function NewDynamicFormRoute() {
  return (
    <AppLayout>
      <main className='mx-auto flex w-full max-w-3xl flex-col gap-6'>
        <Card>
          <CardHeader>
            <h1 className='font-serif text-3xl font-semibold text-brand'>
              Novo formulário
            </h1>
            <p className='text-muted-foreground'>
              O editor de formulários dinâmicos estará disponível em breve.
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
