import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import type { IdProvider } from '../../../shared/interfaces'
import { CollaboratorProfile } from '../../../identity/domain/structures'
import { IntakeStatus } from '../../../intake/domain/structures'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  FormalizationIntakeLifecycleService,
  FormalizationSourceReader,
  FormalizationStartSource,
  FormalizationsRepository,
} from '../../interfaces'
import { StartFormalizationUseCase } from '../start-formalization-use-case'

describe('Start Formalization Use Case', () => {
  let repository: MockProxy<FormalizationsRepository>
  let sourceReader: MockProxy<FormalizationSourceReader>
  let lifecycle: MockProxy<FormalizationIntakeLifecycleService>
  let idProvider: MockProxy<IdProvider>

  beforeEach(() => {
    repository = mock<FormalizationsRepository>()
    sourceReader = mock<FormalizationSourceReader>()
    lifecycle = mock<FormalizationIntakeLifecycleService>()
    idProvider = mock<IdProvider>()
  })

  it('creates one open aggregate for the assigned lawyer and transitions the Intake', async () => {
    const formalization = fakeFormalization()
    const source = {
      intake: {
        id: formalization.intakeId,
        legalAreaId: 'area-civil',
        legalTopicId: 'topic-contracts',
        status: IntakeStatus.ViabilityRegistered,
        version: 2,
      },
      consultation: { id: formalization.consultationId },
      client: { id: formalization.clientId },
      assignedLawyer: { id: formalization.assignedLawyerId, profile: 'lawyer' },
      contractForm: {
        id: formalization.contractFormId,
        name: 'Condições',
        fields: [],
      },
    } as unknown as FormalizationStartSource
    sourceReader.findStartSource.mockResolvedValue(source)
    repository.findByIntakeId.mockResolvedValue(undefined)
    lifecycle.startFormalization.mockResolvedValue(formalization)
    idProvider.generate.mockReturnValue(formalization.id)

    await expect(
      new StartFormalizationUseCase(repository, sourceReader, lifecycle, idProvider).execute({
        intakeId: source.intake.id,
        actorId: source.assignedLawyer.id,
      }),
    ).resolves.toBe(formalization)
    expect(repository.addOrGet).not.toHaveBeenCalled()
    expect(lifecycle.startFormalization).toHaveBeenCalledWith({
      formalization: expect.objectContaining({
        intakeId: source.intake.id,
        legalAreaId: source.intake.legalAreaId,
        legalTopicId: source.intake.legalTopicId,
        contractFormState: 'open',
        contractFormRevision: 0,
      }),
      actorId: source.assignedLawyer.id,
      expectedIntakeVersion: source.intake.version,
    })
  })

  it('allows an admin to start for the assigned lawyer without changing ownership', async () => {
    const formalization = fakeFormalization()
    const adminId = 'admin-collaborator'
    const source = {
      intake: {
        id: formalization.intakeId,
        status: IntakeStatus.ViabilityRegistered,
        version: 2,
      },
      consultation: { id: formalization.consultationId },
      client: { id: formalization.clientId },
      assignedLawyer: { id: formalization.assignedLawyerId, profile: 'lawyer' },
      contractForm: { id: formalization.contractFormId, name: 'Condições', fields: [] },
    } as unknown as FormalizationStartSource
    sourceReader.findStartSource.mockResolvedValue(source)
    repository.findByIntakeId.mockResolvedValue(undefined)
    lifecycle.startFormalization.mockResolvedValue(formalization)
    idProvider.generate.mockReturnValue(formalization.id)

    await expect(
      new StartFormalizationUseCase(repository, sourceReader, lifecycle, idProvider).execute({
        intakeId: source.intake.id,
        actorId: adminId,
        actorProfile: CollaboratorProfile.Admin,
      }),
    ).resolves.toBe(formalization)

    expect(lifecycle.startFormalization).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: adminId,
        formalization: expect.objectContaining({
          assignedLawyerId: source.assignedLawyer.id,
        }),
      }),
    )
  })

  it.each([
    ['terminal', IntakeStatus.Contracted],
    ['not eligible', IntakeStatus.ConsultationCompleted],
  ])('rejects an Intake with a %s status without partial persistence', async (_label, status) => {
    const formalization = fakeFormalization()
    const source = {
      intake: {
        id: formalization.intakeId,
        status,
        version: 2,
      },
      consultation: { id: formalization.consultationId },
      client: { id: formalization.clientId },
      assignedLawyer: { id: formalization.assignedLawyerId, profile: 'lawyer' },
      contractForm: { id: formalization.contractFormId, name: 'Condições', fields: [] },
    } as unknown as FormalizationStartSource
    sourceReader.findStartSource.mockResolvedValue(source)

    await expect(
      new StartFormalizationUseCase(repository, sourceReader, lifecycle, idProvider).execute({
        intakeId: source.intake.id,
        actorId: source.assignedLawyer.id,
      }),
    ).rejects.toThrow('O Intake não está apto para iniciar uma formalização.')

    expect(repository.findByIntakeId).not.toHaveBeenCalled()
    expect(repository.addOrGet).not.toHaveBeenCalled()
    expect(lifecycle.startFormalization).not.toHaveBeenCalled()
  })

  it('allows an idempotent reload after the Intake enters formalization', async () => {
    const formalization = fakeFormalization()
    const source = {
      intake: {
        id: formalization.intakeId,
        status: IntakeStatus.InFormalization,
        version: 3,
      },
      consultation: { id: formalization.consultationId },
      client: { id: formalization.clientId },
      assignedLawyer: { id: formalization.assignedLawyerId, profile: 'lawyer' },
      contractForm: { id: formalization.contractFormId, name: 'Condições', fields: [] },
    } as unknown as FormalizationStartSource
    sourceReader.findStartSource.mockResolvedValue(source)
    repository.findByIntakeId.mockResolvedValue(formalization)

    await expect(
      new StartFormalizationUseCase(repository, sourceReader, lifecycle, idProvider).execute({
        intakeId: source.intake.id,
        actorId: source.assignedLawyer.id,
      }),
    ).resolves.toBe(formalization)

    expect(lifecycle.startFormalization).not.toHaveBeenCalled()
  })

  it('does not persist a Formalization separately when the atomic Intake CAS fails', async () => {
    const formalization = fakeFormalization()
    const source = {
      intake: {
        id: formalization.intakeId,
        status: IntakeStatus.ViabilityRegistered,
        version: 2,
      },
      consultation: { id: formalization.consultationId },
      client: { id: formalization.clientId },
      assignedLawyer: { id: formalization.assignedLawyerId, profile: 'lawyer' },
      contractForm: { id: formalization.contractFormId, name: 'Condições', fields: [] },
    } as unknown as FormalizationStartSource
    const conflict = new Error('Intake version conflict')
    sourceReader.findStartSource.mockResolvedValue(source)
    repository.findByIntakeId.mockResolvedValue(undefined)
    lifecycle.startFormalization.mockRejectedValue(conflict)
    idProvider.generate.mockReturnValue(formalization.id)

    await expect(
      new StartFormalizationUseCase(repository, sourceReader, lifecycle, idProvider).execute({
        intakeId: source.intake.id,
        actorId: source.assignedLawyer.id,
      }),
    ).rejects.toBe(conflict)

    expect(repository.addOrGet).not.toHaveBeenCalled()
    expect(lifecycle.startFormalization).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: source.assignedLawyer.id,
        expectedIntakeVersion: source.intake.version,
      }),
    )
  })
})
