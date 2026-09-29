import { z } from 'zod'

export const registerWabaAccountSchema = z.object({
  lawyerId: z.string().uuid('ID do advogado deve ser um UUID válido'),
  code: z.string().min(1, 'Código de autorização da Meta é obrigatório'),
  wabaId: z.string().min(1, 'WABA ID é obrigatório'),
  phoneNumberId: z.string().min(1, 'Phone Number ID é obrigatório'),
})

export type RegisterWabaAccountInput = z.infer<typeof registerWabaAccountSchema>
