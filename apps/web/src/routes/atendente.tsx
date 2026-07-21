import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AttendantLayout } from '#/ui/shared/widgets/layouts/authenticated-layout/attendant-layout'

export const Route = createFileRoute('/atendente')({
  component: () => (
    <AttendantLayout>
      <Outlet />
    </AttendantLayout>
  ),
})