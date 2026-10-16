import { describe, expect, it } from 'vitest'

import { createCaseSchema } from '../create-case-schema'

const ids = {
  collaborator: '00000000-0000-4000-8000-000000000001',
  intake: '00000000-0000-4000-8000-000000000002',
  area: '00000000-0000-4000-8000-000000000003',
  topic: '00000000-0000-4000-8000-000000000004',
  operation: '00000000-0000-4000-8000-000000000005',
}

describe('createCaseSchema', () => {
  const valid = {
    title: '  Caso  ',
    intakeId: ids.intake,
    legalAreaId: ids.area,
    legalTopicId: ids.topic,
    initialManagerCollaboratorId: ids.collaborator,
    team: [{ collaboratorId: ids.collaborator, role: 'collaborator' }],
    operationId: ids.operation,
  }

  it('requires an explicit Manager and normalizes the title', () => {
    expect(createCaseSchema.parse(valid).title).toBe('Caso')
    expect(
      createCaseSchema.safeParse({ ...valid, initialManagerCollaboratorId: undefined })
        .success,
    ).toBe(false)
  })

  it('rejects malformed IDs, legacy roles/permissions, and extra fields', () => {
    expect(createCaseSchema.safeParse({ ...valid, intakeId: 'invalid' }).success).toBe(
      false,
    )
    expect(createCaseSchema.safeParse({ ...valid, operationId: 'invalid' }).success).toBe(
      false,
    )
    expect(
      createCaseSchema.safeParse({
        ...valid,
        team: [{ collaboratorId: ids.collaborator, role: 'lawyer' }],
      }).success,
    ).toBe(false)
    expect(
      createCaseSchema.safeParse({
        ...valid,
        team: [
          {
            collaboratorId: ids.collaborator,
            role: 'collaborator',
            permission: 'execução',
          },
        ],
      }).success,
    ).toBe(false)
  })
})
