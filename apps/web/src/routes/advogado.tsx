import { Outlet, createFileRoute } from '@tanstack/react-router'
import { LawerLayout } from '#/ui/shared/widgets/layouts/authenticated-layout/lawer-layout'

export const Route = createFileRoute('/advogado')({
  component: () => (
    <LawerLayout>
      <Outlet />
    </LawerLayout>
  ),
})