import {
  ConsultationCompletedEvent,
  ConsultationLegalContextUpdatedEvent,
} from '@hms/core/consultation/domain/events'
import { describe, expect, it } from 'vitest'

import { consultationOutboxEventSchema } from '../consultation-outbox-event-schema'

const envelope = {
  id: '00000000-0000-4000-8000-000000000001',
  consultationId: '00000000-0000-4000-8000-000000000002',
  occurredAt: '2026-09-24T12:00:00.000Z',
}

describe('consultationOutboxEventSchema', () => {
  it('accepts a completed consultation envelope', () => {
    const result = consultationOutboxEventSchema.safeParse({
      ...envelope,
      name: ConsultationCompletedEvent._NAME,
      payload: {
        consultationId: envelope.consultationId,
        intakeId: '00000000-0000-4000-8000-000000000003',
        completedBy: '00000000-0000-4000-8000-000000000004',
        occurredAt: envelope.occurredAt,
      },
    })

    expect(result.success).toBe(true)
  })

  it('accepts a legal-context update with an optional publication timestamp', () => {
    const result = consultationOutboxEventSchema.safeParse({
      ...envelope,
      name: ConsultationLegalContextUpdatedEvent._NAME,
      publishedAt: '2026-09-24T12:01:00.000Z',
      payload: {
        consultationId: envelope.consultationId,
        intakeId: '00000000-0000-4000-8000-000000000003',
        legalAreaId: '00000000-0000-4000-8000-000000000004',
        legalTopicId: '00000000-0000-4000-8000-000000000005',
        updatedBy: '00000000-0000-4000-8000-000000000006',
        occurredAt: envelope.occurredAt,
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects unknown event names, malformed IDs, and extra payload fields', () => {
    const result = consultationOutboxEventSchema.safeParse({
      ...envelope,
      consultationId: 'not-a-uuid',
      name: 'consultation/consultation.created',
      payload: {
        consultationId: envelope.consultationId,
        intakeId: '00000000-0000-4000-8000-000000000003',
        completedBy: '00000000-0000-4000-8000-000000000004',
        occurredAt: envelope.occurredAt,
        legalContent: 'must not cross the outbox boundary',
      },
    })

    expect(result.success).toBe(false)
  })
})
