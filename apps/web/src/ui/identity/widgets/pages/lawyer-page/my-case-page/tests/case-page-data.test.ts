import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { describe, expect, it } from 'vitest'

import { getCaseStages, getCaseStatusLabel } from '../case-page-data'

describe('getCaseStages', () => {
  it('keeps documentation active before the case enters legal production', () => {
    const stages = getCaseStages(LegalCaseStatus.Documentation)

    expect(stages[0]).toMatchObject({
      icon: 'file-text',
      label: 'Documentação',
      isActive: true,
    })
    expect(stages[1]).toMatchObject({
      label: 'Produção Jurídica',
      isActive: false,
    })
  })

  it('marks documentation complete and legal production active for a homologated case', () => {
    const stages = getCaseStages(LegalCaseStatus.LegalProduction)

    expect(stages[0]).toMatchObject({
      icon: 'check',
      label: 'Documentação',
      status: 'Concluída',
      isActive: false,
    })
    expect(stages[1]).toMatchObject({
      label: 'Produção Jurídica',
      isActive: true,
    })
  })

  it.each([
    [LegalCaseStatus.ReadyForLegalProduction, 1],
    [LegalCaseStatus.LegalProduction, 1],
    [LegalCaseStatus.ProtocolDelivery, 2],
    [LegalCaseStatus.Execution, 3],
    [LegalCaseStatus.Closed, 4],
  ] as const)('activates the stage matching case status %s', (status, activeIndex) => {
    const stages = getCaseStages(status)

    expect(stages.findIndex((stage) => stage.isActive)).toBe(activeIndex)
    expect(stages.slice(0, activeIndex).every((stage) => stage.icon === 'check')).toBe(
      true,
    )
  })

  it('shows the closure stage active with earlier stages complete in the closure view', () => {
    const stages = getCaseStages(LegalCaseStatus.Execution, true)

    expect(stages.slice(0, 4).every((stage) => stage.status === 'Concluída')).toBe(true)
    expect(stages[4]).toMatchObject({
      label: 'Encerramento',
      status: 'Em andamento — 2º dia',
      isActive: true,
    })
  })

  it('maps every lifecycle status to the matching header label', () => {
    expect(getCaseStatusLabel(LegalCaseStatus.Documentation)).toBe(
      'Documentação em formação',
    )
    expect(getCaseStatusLabel(LegalCaseStatus.ReadyForLegalProduction)).toBe(
      'Em andamento',
    )
    expect(getCaseStatusLabel(LegalCaseStatus.LegalProduction)).toBe(
      'Em produção jurídica',
    )
    expect(getCaseStatusLabel(LegalCaseStatus.ProtocolDelivery)).toBe(
      'Protocolo e entrega',
    )
    expect(getCaseStatusLabel(LegalCaseStatus.Execution)).toBe('Execução')
    expect(getCaseStatusLabel(LegalCaseStatus.Closed)).toBe('Encerrado')
  })
})
