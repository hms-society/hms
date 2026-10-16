import { describe, expect, it } from 'vitest'

import {
  confirmFormalizationContractingSchema,
  formalizationCompletionSummarySchema,
  formalizationContractingResultSchema,
} from '../formalization-contracting-schema'

const ids = {
  formalizationId: '00000000-0000-4000-8000-000000000001',
  intakeId: '00000000-0000-4000-8000-000000000002',
  signatureRequestId: '00000000-0000-4000-8000-000000000003',
}

describe('formalization contracting schemas', () => {
  it('accepts a complete contracting command and rejects malformed revisions or keys', () => {
    const command = {
      expectedFormalizationVersion: 2,
      expectedIntakeVersion: 3,
      expectedRequestVersion: 4,
      confirmationKey: '00000000-0000-4000-8000-000000000004',
    }

    expect(confirmFormalizationContractingSchema.parse(command)).toEqual(command)

    for (const invalidCommand of [
      { ...command, expectedFormalizationVersion: 0 },
      { ...command, expectedIntakeVersion: 1.5 },
      { ...command, expectedRequestVersion: -1 },
      { ...command, confirmationKey: 'not-a-uuid' },
      { ...command, unexpected: true },
    ]) {
      expect(confirmFormalizationContractingSchema.safeParse(invalidCommand).success).toBe(
        false,
      )
    }
  })

  it('accepts a completed contracting result with an ISO timestamp', () => {
    const result = {
      formalizationId: ids.formalizationId,
      formalizationStatus: 'completed',
      formalizationVersion: 5,
      intakeId: ids.intakeId,
      intakeStatus: 'contracted',
      intakeVersion: 7,
      contractedAt: '2026-10-16T12:00:00.000Z',
      duplicate: false,
    }

    expect(formalizationContractingResultSchema.parse(result)).toEqual(result)
  })

  it('accepts a completed formalization summary and rejects incomplete or malformed data', () => {
    const summary = {
      formalizationId: ids.formalizationId,
      intakeId: ids.intakeId,
      status: 'completed',
      completedAt: '2026-10-16T12:00:00.000Z',
      signatureRequestId: ids.signatureRequestId,
      signatureStatus: 'confirmed',
    }

    expect(formalizationCompletionSummarySchema.parse(summary)).toEqual(summary)

    for (const invalidSummary of [
      { ...summary, formalizationId: 'invalid' },
      { ...summary, status: 'in_progress' },
      { ...summary, completedAt: '2026-10-16' },
      { ...summary, signatureStatus: 'sent' },
      { ...summary, unexpected: true },
    ]) {
      expect(formalizationCompletionSummarySchema.safeParse(invalidSummary).success).toBe(
        false,
      )
    }
  })
})
