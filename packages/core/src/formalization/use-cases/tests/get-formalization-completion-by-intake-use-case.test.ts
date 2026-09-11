import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers/formalization-faker'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers/formalization-signature-request-faker'
import { FormalizationSignatureSendingForbiddenError } from '../../domain/errors'
import type { FormalizationsRepository, FormalizationSignatureRequestsRepository } from '../../interfaces'
import { GetFormalizationCompletionByIntakeUseCase } from '../get-formalization-completion-by-intake-use-case'

describe('Get Formalization Completion By Intake Use Case', () => {
  it('returns the least-privilege completed projection for its owner', async () => {
    const completedAt = new Date('2026-09-01T10:00:00.000Z')
    const formalization = fakeFormalization({
      status: 'completed', completedAt, completedByCollaboratorId: 'lawyer',
      contractingConfirmationKey: 'key', signatureRequestId: 'request-1',
    })
    const request = fakeFormalizationSignatureRequest({
      id: 'request-1', formalizationId: formalization.id, status: 'confirmed',
    })
    const formalizations = mock<FormalizationsRepository>()
    const requests = mock<FormalizationSignatureRequestsRepository>()
    formalizations.findByIntakeId.mockResolvedValue(formalization)
    requests.findById.mockResolvedValue(request)

    await expect(
      new GetFormalizationCompletionByIntakeUseCase(formalizations, requests).execute({
        intakeId: formalization.intakeId, actorId: formalization.assignedLawyerId,
      }),
    ).resolves.toEqual({
      formalizationId: formalization.id, intakeId: formalization.intakeId,
      status: 'completed', completedAt, signatureRequestId: request.id, signatureStatus: 'confirmed',
    })
  })

  it('returns null before completion and rejects collaborators outside ownership', async () => {
    const formalization = fakeFormalization()
    const formalizations = mock<FormalizationsRepository>()
    const requests = mock<FormalizationSignatureRequestsRepository>()
    formalizations.findByIntakeId.mockResolvedValue(formalization)
    const useCase = new GetFormalizationCompletionByIntakeUseCase(formalizations, requests)
    await expect(useCase.execute({ intakeId: formalization.intakeId, actorId: formalization.assignedLawyerId }))
      .resolves.toBeNull()
    await expect(useCase.execute({ intakeId: formalization.intakeId, actorId: 'other' }))
      .rejects.toBeInstanceOf(FormalizationSignatureSendingForbiddenError)
  })
})
