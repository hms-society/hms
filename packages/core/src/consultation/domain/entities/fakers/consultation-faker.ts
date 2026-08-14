import { faker } from '@faker-js/faker'

import type { Consultation } from '../consultation'
import { ConsultationModality } from '../../structures'

export class ConsultationFaker {
  static fake(overrides: Partial<Consultation> = {}): Consultation {
    return {
      id: faker.string.uuid(),
      intakeId: faker.string.uuid(),
      appointmentId: faker.string.uuid(),
      clientId: faker.string.uuid(),
      assignedLawyerId: faker.string.uuid(),
      legalAreaId: faker.string.uuid(),
      legalTopicId: faker.string.uuid(),
      modality: ConsultationModality.InPerson,
      status: 'pending',
      relevantFacts: [],
      potentialLegalRequests: [],
      identifiedRisks: [],
      suggestions: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      ...overrides,
    } as Consultation
  }

  static fakeMany(count = 10): Consultation[] {
    return Array.from({ length: count }, () => ConsultationFaker.fake())
  }
}
