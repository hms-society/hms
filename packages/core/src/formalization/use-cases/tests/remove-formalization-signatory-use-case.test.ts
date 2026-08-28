import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { RemoveFormalizationSignatoryUseCase } from '../remove-formalization-signatory-use-case'
import {
  makeConfiguration,
  makeFormalization,
  makeSignatory,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Remove Formalization Signatory Use Case', () => {
  it('rejects removal of a default signatory', async () => {
    const formalization = makeFormalization()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    repository.findByFormalizationId.mockResolvedValue(
      makeConfiguration({ formalizationId: formalization.id }),
    )
    const formalizationsRepository = mock<FormalizationsRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    await expect(
      new RemoveFormalizationSignatoryUseCase(
        formalizationsRepository,
        repository,
        mock<FormalizationSignatureSourceReader>(),
        mock<DatetimeProvider>(),
        mock<IdProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        signatoryId: 'signatory-id',
        expectedVersion: formalization.version,
      }),
    ).rejects.toThrow('não podem ser removidos')
  })

  it('removes only an additional collaborator', async () => {
    const formalization = makeFormalization()
    const additional = makeSignatory({
      signatoryId: 'additional-id',
      personId: 'additional-person',
      role: 'additional_collaborator',
      name: 'Paralegal',
      profile: 'paralegal',
      removable: true,
    })
    const configuration = makeConfiguration({
      formalizationId: formalization.id,
      signatories: [makeSignatory(), additional],
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const datetimeProvider = mock<DatetimeProvider>()
    const idProvider = mock<IdProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(configuration)
    sourceReader.listCurrentDocuments.mockResolvedValue([])
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    repository.replaceConfiguration.mockResolvedValue(
      makeConfiguration({ formalizationId: formalization.id }),
    )
    await expect(
      new RemoveFormalizationSignatoryUseCase(
        formalizationsRepository,
        repository,
        sourceReader,
        datetimeProvider,
        idProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        signatoryId: 'additional-id',
        expectedVersion: formalization.version,
      }),
    ).resolves.toBeDefined()
  })
})
