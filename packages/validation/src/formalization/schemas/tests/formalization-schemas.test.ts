import { describe, expect, expectTypeOf, it } from 'vitest'

import type {
  CloseFormalizationWithoutContractRequest,
  GenerateFormalizationDocumentRequest,
  ReviewFormalizationDocumentVersionRequest,
  SaveFormalizationContractFormRequest,
} from '@hms/core/formalization/interfaces'
import type { DynamicFormAnswer } from '@hms/core/shared/domain/structures'

import {
  closeFormalizationWithoutContractSchema,
  confirmFormalizationDocumentsSchema,
  formalizationContractFormAnswerSchema,
  formalizationContractFormAnswersSchema,
  formalizationDocumentGenerationResponseSchema,
  formalizationErrorResponseSchema,
  formalizationIssueSchema,
  generateFormalizationDocumentSchema,
  reopenFormalizationContractFormSchema,
  replaceFormalizationDocumentSelectionSchema,
  reviewFormalizationDocumentVersionSchema,
  saveFormalizationDocumentVersionSchema,
  startFormalizationSchema,
  updateFormalizationContractFormSchema,
} from '..'

const intakeId = '4f4a9d94-0f4a-4d7b-9b5f-6d27aa3e6d6a'
const formalizationId = '5f4a9d94-0f4a-4d7b-9b5f-6d27aa3e6d6a'
const fieldIds = {
  text: '6f4a9d94-0f4a-4d7b-9b5f-6d27aa3e6d6a',
  selection: '7f4a9d94-0f4a-4d7b-9b5f-6d27aa3e6d6a',
  numeric: '8f4a9d94-0f4a-4d7b-9b5f-6d27aa3e6d6a',
  conditional: '9f4a9d94-0f4a-4d7b-9b5f-6d27aa3e6d6a',
}

const answers = [
  { fieldId: fieldIds.text, value: 'Pagamento à vista' },
  { fieldId: fieldIds.selection, value: ['pix', 'boleto'] },
  { fieldId: fieldIds.numeric, value: 12.5 },
  { fieldId: fieldIds.conditional, value: true },
  { fieldId: fieldIds.text, value: null },
]

describe('Formalization schemas', () => {
  it('accepts all transport answer value types without applying Core rules', () => {
    expect(formalizationContractFormAnswersSchema.parse(answers)).toEqual(answers)
    expect(
      formalizationContractFormAnswerSchema.parse({
        fieldId: fieldIds.numeric,
        value: Number.MAX_VALUE,
      }),
    ).toMatchObject({ fieldId: fieldIds.numeric, value: Number.MAX_VALUE })
    expect(
      formalizationContractFormAnswerSchema.safeParse({
        fieldId: fieldIds.numeric,
        value: Number.NaN,
      }).success,
    ).toBe(false)
  })

  it('keeps duplicate answers, option membership, numeric ranges and conditionals in Core', () => {
    const duplicateAnswers = [
      { fieldId: fieldIds.selection, value: 'monthly' },
      { fieldId: fieldIds.selection, value: 'annual' },
    ]

    expect(formalizationContractFormAnswersSchema.parse(duplicateAnswers)).toEqual(
      duplicateAnswers,
    )
    expect(
      formalizationContractFormAnswersSchema.parse([
        { fieldId: fieldIds.conditional, value: 'trigger-value' },
      ]),
    ).toEqual([{ fieldId: fieldIds.conditional, value: 'trigger-value' }])
  })

  it('accepts only the start identifier and rejects actor or source snapshots', () => {
    expect(startFormalizationSchema.parse({ intakeId })).toEqual({ intakeId })
    expect(
      startFormalizationSchema.safeParse({ intakeId, actorId: formalizationId }).success,
    ).toBe(false)
    expect(
      startFormalizationSchema.safeParse({
        intakeId,
        source: { formalization: { id: formalizationId } },
      }).success,
    ).toBe(false)
  })

  it('validates draft and close form requests with optimistic versions', () => {
    const request = { expectedVersion: 3, answers }

    expect(updateFormalizationContractFormSchema.parse(request)).toEqual(request)
    expect(
      updateFormalizationContractFormSchema.safeParse({ expectedVersion: 0, answers }).success,
    ).toBe(false)
    expect(
      updateFormalizationContractFormSchema.safeParse({
        expectedVersion: 3,
        answers,
        contractFormSnapshot: {},
      }).success,
    ).toBe(false)
  })

  it('validates reopen, selection, generation, review and confirmation actions', () => {
    expect(reopenFormalizationContractFormSchema.parse({ expectedVersion: 2 })).toEqual({
      expectedVersion: 2,
    })
    expect(
      replaceFormalizationDocumentSelectionSchema.parse({
        documentSpecificationIds: [intakeId],
      }),
    ).toEqual({ documentSpecificationIds: [intakeId] })
    expect(generateFormalizationDocumentSchema.parse({})).toEqual({})
    expect(
      generateFormalizationDocumentSchema.parse({ instructions: 'Use the current facts.' }),
    ).toEqual({ instructions: 'Use the current facts.' })
    expect(
      reviewFormalizationDocumentVersionSchema.parse({
        status: 'rejected',
        rejectionReason: 'A cláusula precisa ser revisada.',
      }),
    ).toEqual({ status: 'rejected', rejectionReason: 'A cláusula precisa ser revisada.' })
    expect(confirmFormalizationDocumentsSchema.parse({ expectedVersion: 4 })).toEqual({
      expectedVersion: 4,
    })
    expect(
      reviewFormalizationDocumentVersionSchema.safeParse({ status: 'in_review' }).success,
    ).toBe(false)
  })

  it('validates closure reason, notes and both concurrency versions', () => {
    const request = {
      expectedVersion: 2,
      expectedIntakeVersion: 7,
      reason: 'client_withdrew' as const,
      notes: 'Cliente solicitou o encerramento.',
    }

    expect(closeFormalizationWithoutContractSchema.parse(request)).toEqual(request)
    expect(
      closeFormalizationWithoutContractSchema.safeParse({
        expectedVersion: 2,
        expectedIntakeVersion: 7,
        closureReason: 'client_withdrew',
      }).success,
    ).toBe(false)
  })

  it('publishes stable issue and action response shapes', () => {
    const issue = { path: `field:${fieldIds.numeric}`, message: 'Informe um número válido.' }
    expect(formalizationIssueSchema.parse(issue)).toEqual(issue)
    expect(
      formalizationErrorResponseSchema.parse({
        statusCode: 400,
        title: 'Dados inválidos',
        message: 'Revise os dados enviados.',
        timestamp: '2026-08-24T12:00:00.000Z',
        path: '/formalizations/123',
        issues: [issue],
      }),
    ).toMatchObject({ issues: [issue] })
    expect(
      formalizationDocumentGenerationResponseSchema.parse({
        documentGenerationId: intakeId,
        documentId: formalizationId,
      }),
    ).toEqual({ documentGenerationId: intakeId, documentId: formalizationId })
    expect(formalizationIssueSchema.safeParse({ path: '', message: 'Erro' }).success).toBe(false)
  })

  it('keeps inferred payloads assignable to the Core request contracts', () => {
    expectTypeOf<
      import('../formalization-contract-form-answers-schema').FormalizationContractFormAnswerInput
    >().toMatchTypeOf<DynamicFormAnswer>()
    expectTypeOf<import('../update-formalization-contract-form-schema').UpdateFormalizationContractFormInput>().toMatchTypeOf<
      SaveFormalizationContractFormRequest
    >()
    expectTypeOf<import('../close-formalization-without-contract-schema').CloseFormalizationWithoutContractInput>().toMatchTypeOf<
      CloseFormalizationWithoutContractRequest
    >()
    expectTypeOf<import('../generate-formalization-document-schema').GenerateFormalizationDocumentInput>().toMatchTypeOf<
      GenerateFormalizationDocumentRequest
    >()
    expectTypeOf<import('../review-formalization-document-version-schema').ReviewFormalizationDocumentVersionInput>().toMatchTypeOf<
      ReviewFormalizationDocumentVersionRequest
    >()
  })

  it('rejects malformed identifiers, numeric versions, answers and action data', () => {
    expect(formalizationContractFormAnswerSchema.safeParse({ fieldId: 'not-uuid', value: true }).success).toBe(false)
    expect(updateFormalizationContractFormSchema.safeParse({ expectedVersion: 1.5, answers: [] }).success).toBe(false)
    expect(confirmFormalizationDocumentsSchema.safeParse({ expectedVersion: Number.POSITIVE_INFINITY }).success).toBe(false)
    expect(replaceFormalizationDocumentSelectionSchema.safeParse({ documentSpecificationIds: ['not-uuid'] }).success).toBe(false)
    expect(generateFormalizationDocumentSchema.safeParse({ instructions: '   ' }).success).toBe(false)
    expect(saveFormalizationDocumentVersionSchema.safeParse({ sourceDocumentVersionId: 'not-uuid', content: { type: 'doc' } }).success).toBe(false)
    expect(closeFormalizationWithoutContractSchema.safeParse({ expectedVersion: 1, expectedIntakeVersion: 1, reason: 'unknown' }).success).toBe(false)
  })
})
