import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '#/ui/identity/widgets/pages/home'

export const Route = createFileRoute('/home')({
  component: HomePage,
})
