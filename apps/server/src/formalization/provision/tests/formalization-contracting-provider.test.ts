import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeFormalization } from '@hms/core/formalization/domain/entities/fakers'
import { FormalizationContractingConflictError } from '@hms/core/formalization/domain/errors'
import type {
  FormalizationContractingTransaction,
  FormalizationsRepository,
} from '@hms/core/formalization/interfaces'
import { IntakeFaker } from '@hms/core/intake/domain/entities/fakers'
import type { IntakeContractingService } from '@hms/core/intake/interfaces'
import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { FormalizationModuleFixture } from '@/formalization/fixtures'
import { FormalizationContractingProvider } from '@/formalization/provision/formalization-contracting-provider'
import { INTAKE_REPOSITORIES } from '@/intake/constants/intake-repositories'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

describe('FormalizationContractingProvider', () => {
  let fixture: FormalizationModuleFixture

  beforeAll(async () => {
    fixture = await FormalizationModuleFixture.register()
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('rolls back the Intake when the Formalization CAS fails after contracting it', async () => {
    const intakeId = fixture.idProvider.generate()
    const formalizationId = fixture.idProvider.generate()
    const requestId = fixture.idProvider.generate()
    const intake = IntakeFaker.fake({
      id: intakeId,
      status: IntakeStatus.InFormalization,
      version: 1,
      contractedAt: undefined,
      closureReason: undefined,
      closureNotes: undefined,
      closedAt: undefined,
    })
    const formalization = fakeFormalization({
      id: formalizationId,
      intakeId,
      signatureRequestId: requestId,
      assignedLawyerId: fixture.collaboratorId,
      version: 1,
    })

    await fixture.app.get(INTAKE_REPOSITORIES.intakes).add(intake)
    await fixture.app
      .get(FORMALIZATION_REPOSITORIES.formalizations)
      .addOrGet(formalization)

    const transaction = fixture.app.get<FormalizationContractingTransaction>(
      FORMALIZATION_PROVIDERS.contractingTransaction,
    )

    await expect(
      transaction.confirm({
        formalizationId,
        intakeId,
        requestId,
        expectedFormalizationVersion: 2,
        expectedIntakeVersion: 1,
        expectedRequestVersion: 1,
        actorId: fixture.collaboratorId,
        confirmationKey: fixture.idProvider.generate(),
        contractedAt: fixture.datetimeProvider.now(),
      }),
    ).rejects.toBeInstanceOf(FormalizationContractingConflictError)

    await expect(
      fixture.app.get(INTAKE_REPOSITORIES.intakes).findById(intakeId),
    ).resolves.toMatchObject({
      id: intakeId,
      status: IntakeStatus.InFormalization,
      version: 1,
      contractedAt: undefined,
    })
    await expect(
      fixture.formalizationsRepository.findById(formalizationId),
    ).resolves.toMatchObject({
      id: formalizationId,
      status: 'in_progress',
      version: 1,
      contractingConfirmationKey: undefined,
    })
  })

  it('uses only the public contracting service when converging a duplicate', async () => {
    const intakeId = fixture.idProvider.generate()
    const formalizationId = fixture.idProvider.generate()
    const requestId = fixture.idProvider.generate()
    const contractedAt = fixture.datetimeProvider.now()
    const intake = IntakeFaker.fake({
      id: intakeId,
      status: IntakeStatus.Contracted,
      version: 7,
      contractedAt,
    })
    const formalization = fakeFormalization({
      id: formalizationId,
      intakeId,
      signatureRequestId: requestId,
      status: 'completed',
      version: 4,
      contractingConfirmationKey: 'same-confirmation',
    })
    const formalizationsRepository = {
      findById: vi.fn().mockResolvedValue(formalization),
    } as unknown as FormalizationsRepository
    const intakeContractingService = {
      contract: vi.fn().mockResolvedValue(intake),
    } satisfies IntakeContractingService
    const provider = new FormalizationContractingProvider(
      {
        runInTransaction: async <T>(callback: () => Promise<T>) => callback(),
      } as unknown as DrizzleClient,
      formalizationsRepository,
      intakeContractingService,
    )

    await expect(
      provider.confirm({
        formalizationId,
        intakeId,
        requestId,
        expectedFormalizationVersion: 99,
        expectedIntakeVersion: 1,
        expectedRequestVersion: 99,
        actorId: fixture.collaboratorId,
        confirmationKey: 'same-confirmation',
        contractedAt,
      }),
    ).resolves.toEqual({
      outcome: 'duplicate',
      result: {
        formalizationId,
        formalizationStatus: 'completed',
        formalizationVersion: 4,
        intakeId,
        intakeStatus: 'contracted',
        intakeVersion: 7,
        contractedAt,
        duplicate: true,
      },
    })
    expect(intakeContractingService.contract).toHaveBeenCalledWith({
      intakeId,
      expectedVersion: 1,
      contractedAt,
      updatedBy: fixture.collaboratorId,
    })
  })
})
