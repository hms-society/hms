import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const consultasSearchSchema = z.object({
  clienteId: z.string().optional(),
  clientId: z.string().optional(),
})

export const Route = createFileRoute('/atendimento/consultas')({
  validateSearch: (search) => consultasSearchSchema.parse(search),
  component: () => null,
})
