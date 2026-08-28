import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/formalizacoes/$formalizationId')({
  component: FormalizationRouteLayout,
})

function FormalizationRouteLayout() {
  return <Outlet />
}
