import { z } from 'zod'

export const stepDemandSchema = z.object({
  origem: z.string().min(1, 'Selecione a origem'),
  canal: z.string().min(1, 'Selecione o canal de contato'),
  areaJuridica: z.string().min(1, 'Selecione a área jurídica'),
  temaJuridico: z.string().min(1, 'Selecione o tema jurídico'),
  urgencia: z.string().min(1, 'Selecione o grau de urgência'),
  observacoes: z.string().optional(),
})

export const stepClientSchema = z.object({
  clienteVinculado: z.boolean().refine((v) => v === true, {
    message: 'Vincule ou cadastre uma pessoa antes de continuar',
  }),
})

export const stepDecisionSchema = z
  .object({
    tipoCard: z.enum(['agendar', 'registrar']),
    modalidade: z.enum(['virtual', 'presencial']).optional(),
    canalVirtual: z.string().optional(),
    local: z.string().optional(),
    advogado: z.string().optional(),
    data: z.date().optional(),
    horario: z.string().optional(),
    motivo: z.string().optional(),
    observacoesEncerramento: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipoCard === 'agendar') {
      if (!data.advogado || data.advogado.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione um advogado',
          path: ['advogado'],
        })
      }
      if (!data.horario || data.horario.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione um horário',
          path: ['horario'],
        })
      }
      if (data.modalidade === 'virtual' && !data.canalVirtual) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione o canal virtual',
          path: ['canalVirtual'],
        })
      }
      if (data.modalidade === 'presencial' && !data.local?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe o local do atendimento',
          path: ['local'],
        })
      }
    }

    if (data.tipoCard === 'registrar') {
      if (!data.motivo || data.motivo.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione o motivo do encerramento',
          path: ['motivo'],
        })
      }
    }
  })

export const intakeFullSchema = stepDemandSchema
  .merge(stepClientSchema)
  .merge(stepDecisionSchema)

export type IntakeFullData = z.infer<typeof intakeFullSchema>
