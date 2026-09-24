import type { Intake, IntakeCreation } from '@hms/core/intake/domain/entities'
import type { IntakesRepository } from '@hms/core/intake/interfaces'
import { describe, expect, it, vi } from 'vitest'

import { IntakeSeeder } from '@/intake/database/intake-seeder'

describe('IntakeSeeder', () => {
  it('seeds the configured retirement client with the previdenciary classification', async () => {
    let seededIntakes: IntakeCreation[] = []
    const repository = {
      addMany: vi.fn(async (intakes: IntakeCreation[]) => {
        seededIntakes = intakes
        return intakes.map((intake, index) => ({
          ...intake,
          id: `intake-${index}`,
          sequenceNumber: index + 1,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) as Intake[]
      }),
    } as unknown as IntakesRepository
    const seeder = new IntakeSeeder(repository)

    await seeder.run({
      clientIds: ['general-client', 'vinicius-client'],
      documentProductionClientId: 'general-client',
      previdenciaryClientId: 'vinicius-client',
      previdenciaryLegalAreaId: 'previdenciary-area',
      previdenciaryLegalTopicId: 'retirement-topic',
      responsibleId: 'responsible',
      actorId: 'actor',
      legalAreaId: 'civil-area',
      legalTopicId: 'contracts-topic',
    })

    const viniciusIntake = seededIntakes.find(
      ({ clientId }) => clientId === 'vinicius-client',
    )

    expect(viniciusIntake).toMatchObject({
      legalAreaId: 'previdenciary-area',
      legalTopicId: 'retirement-topic',
      status: 'contracted',
      demandNotes: expect.stringContaining('aposentadoria por tempo de contribuição'),
    })
  })
})
