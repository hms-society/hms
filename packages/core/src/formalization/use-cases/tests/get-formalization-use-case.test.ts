import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  FormalizationContext,
  FormalizationSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { GetFormalizationUseCase } from '../get-formalization-use-case'

describe('Get Formalization Use Case', () => {
  let repository: MockProxy<FormalizationsRepository>
  let sourceReader: MockProxy<FormalizationSourceReader>

  beforeEach(() => {
    repository = mock<FormalizationsRepository>()
    sourceReader = mock<FormalizationSourceReader>()
  })

  it('returns the aggregate and server-owned context for its assigned lawyer', async () => {
    const formalization = fakeFormalization()
    const context = {
      intake: { id: formalization.intakeId },
      consultation: { id: formalization.consultationId },
      client: { id: formalization.clientId },
      assignedLawyer: { id: formalization.assignedLawyerId },
    } as unknown as FormalizationContext
    repository.findById.mockResolvedValue(formalization)
    sourceReader.findContext.mockResolvedValue(context)

    await expect(
      new GetFormalizationUseCase(repository, sourceReader).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
      }),
    ).resolves.toEqual({ formalization, ...context })
  })

  it("allows an admin to read another collaborator's Formalization", async () => {
    const formalization = fakeFormalization()
    const context = {
      intake: { id: formalization.intakeId },
      consultation: { id: formalization.consultationId },
      client: { id: formalization.clientId },
      assignedLawyer: { id: formalization.assignedLawyerId },
    } as unknown as FormalizationContext
    repository.findById.mockResolvedValue(formalization)
    sourceReader.findContext.mockResolvedValue(context)

    await expect(
      new GetFormalizationUseCase(repository, sourceReader).execute({
        formalizationId: formalization.id,
        actorId: 'admin-collaborator',
        actorProfile: CollaboratorProfile.Admin,
      }),
    ).resolves.toEqual({ formalization, ...context })
  })
})
