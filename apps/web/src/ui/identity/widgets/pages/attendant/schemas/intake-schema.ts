import { z } from 'zod'

export const stepDemandSchema = z.object({
  origem: z.string({ message: 'Selecione a origem' }).min(1, 'Selecione a origem'),
  canal: z.string({ message: 'Selecione o canal de contato' }).min(1, 'Selecione o canal de contato'),
  areaJuridica: z.string({ message: 'Selecione a área jurídica' }).min(1, 'Selecione a área jurídica'),
  temaJuridico: z.string({ message: 'Selecione o tema jurídico' }).min(1, 'Selecione o tema jurídico'),
  urgencia: z.string({ message: 'Selecione o grau de urgência' }).min(1, 'Selecione o grau de urgência'),
  observacoes: z.string().optional(),
})

export const stepClientSchema = z.object({
  clienteVinculado: z.boolean().refine((v) => v === true, {
    message: 'Vincule ou cadastre uma pessoa antes de continuar',
  }),
})

export const stepDecisionAgendarSchema = z
  .object({
    modalidade: z.enum(['virtual', 'presencial'], {
      message: 'Selecione a modalidade',
    }),
    canalVirtual: z.string().optional(),
    local: z.string().optional(),
    advogado: z.string({ message: 'Selecione um advogado' }).min(1, 'Selecione um advogado'),
    data: z.date({ message: 'Selecione uma data' }),
    horario: z.string({ message: 'Selecione um horário' }).min(1, 'Selecione um horário'),
  })
  .superRefine((data, ctx) => {
    if (data.modalidade === 'virtual' && !data.canalVirtual) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o canal virtual',
        path: ['canalVirtual'],
      })
    }
    if (data.modalidade === 'presencial' && !data.local) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o local do atendimento',
        path: ['local'],
      })
    }
  })

export const stepDecisionEncerrarSchema = z.object({
  motivo: z.string({ message: 'Selecione o motivo do encerramento' }).min(1, 'Selecione o motivo do encerramento'),
  observacoes: z.string().optional(),
})

export type StepDemandData = z.infer<typeof stepDemandSchema>
export type StepClientData = z.infer<typeof stepClientSchema>
export type StepDecisionAgendarData = z.infer<typeof stepDecisionAgendarSchema>
export type StepDecisionEncerrarData = z.infer<typeof stepDecisionEncerrarSchema>