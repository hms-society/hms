import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AttendantLayout } from '#/ui/shared/widgets/layouts/authenticated-layout/attendant-layout'

export const Route = createFileRoute('/atendimento')({
  component: () => (
    <AttendantLayout>
      <Outlet />
    </AttendantLayout>
  ),
})
