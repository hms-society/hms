import { LegalCaseStatus } from '@hms/core/case-management/domain/structures'
import { describe, expect, it } from 'vitest'

import { getCaseStages } from '../case-page-data'

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
})
