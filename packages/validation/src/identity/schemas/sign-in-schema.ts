import { z } from 'zod'

export const signInSchema = z.object({
  identifier: z.string().min(1, 'Informe o email.'),
  password: z.string().min(1, 'Informe a senha.'),
})
