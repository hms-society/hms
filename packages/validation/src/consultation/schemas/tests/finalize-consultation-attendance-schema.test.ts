import { describe, expect, it } from 'vitest'
import { finalizeConsultationAttendanceSchema } from '../finalize-consultation-attendance-schema'

const validAttendance = {
  legalAreaId: '4a664059-7f45-435f-b5b3-407d8f1652b6',
  legalTopicId: 'fd56da99-08c5-4adb-b153-217872297b08',
  modality: 'in_person' as const,
  primaryLegalQuestion: 'Qual é a dúvida jurídica principal?',
  guidanceProvided: 'A orientação foi registrada durante o atendimento.',
  viability: 'Viável',
  decision: 'Prosseguir para contratação',
}

describe('finalizeConsultationAttendanceSchema', () => {
  it('requires viability and forwarding decision', () => {
    const result = finalizeConsultationAttendanceSchema.safeParse({
      ...validAttendance,
      viability: '',
      decision: '',
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.flatten().fieldErrors.viability).toContain(
      'A viabilidade jurídica é obrigatória.',
    )
    expect(result.error.flatten().fieldErrors.decision).toContain(
      'A decisão de encaminhamento é obrigatória.',
    )
  })

  it('requires a channel only for virtual consultations', () => {
    const result = finalizeConsultationAttendanceSchema.safeParse({
      ...validAttendance,
      modality: 'virtual',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.flatten().fieldErrors.channel).toContain(
      'O canal é obrigatório para consultas virtuais.',
    )
  })

  it('requires an infeasible viability for closing without a contract', () => {
    const result = finalizeConsultationAttendanceSchema.safeParse({
      ...validAttendance,
      viability: 'Viável',
      decision: 'Encerrar sem contratação',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.flatten().fieldErrors.viability).toContain(
      'Para encerrar sem contratação, selecione a classificação "Inviável".',
    )
  })

  it('requires a viable classification for proceeding or requesting a new consultation', () => {
    const result = finalizeConsultationAttendanceSchema.safeParse({
      ...validAttendance,
      viability: 'Inviável',
      decision: 'Nova consulta',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.flatten().fieldErrors.viability).toContain(
      'Para esta decisão, selecione "Viável" ou "Viável com ressalvas".',
    )
  })
})
