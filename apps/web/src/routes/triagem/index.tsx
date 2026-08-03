import { createFileRoute } from '@tanstack/react-router'
import { Triagem } from '@/ui/identity/widgets/pages/paralegal-page/triagem'

export const Route = createFileRoute('/triagem/')({
  component: Triagem,
})

