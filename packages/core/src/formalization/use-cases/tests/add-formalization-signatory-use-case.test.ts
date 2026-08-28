import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { AddFormalizationSignatoryUseCase } from '../add-formalization-signatory-use-case'
import {
  makeConfiguration,
  makeFormalization,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Add Formalization Signatory Use Case', () => {
  it('adds an eligible collaborator with an available channel', async () => {
    const formalization = makeFormalization()
    const configuration = makeConfiguration({ formalizationId: formalization.id })
    const updated = makeConfiguration({
      formalizationId: formalization.id,
      signatories: [
        ...configuration.signatories,
        {
          signatoryId: 'new-signatory',
          personId: 'collaborator-id',
          role: 'additional_collaborator',
          name: 'Advogada',
          profile: 'lawyer',
          removable: true,
          availableChannels: ['email'],
          selectedChannels: [],
          documentIds: [],
        },
      ],
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const datetimeProvider = mock<DatetimeProvider>()
    const idProvider = mock<IdProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(configuration)
    sourceReader.findPerson.mockResolvedValue({
      personId: 'collaborator-id',
      name: 'Advogada',
      profile: 'lawyer',
      email: 'a@example.com',
      availableChannels: ['email'],
    })
    sourceReader.listCurrentDocuments.mockResolvedValue([])
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    idProvider.generate.mockReturnValue('new-signatory')
    repository.replaceConfiguration.mockResolvedValue(updated)

    await expect(
      new AddFormalizationSignatoryUseCase(
        formalizationsRepository,
        repository,
        sourceReader,
        datetimeProvider,
        idProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        personId: 'collaborator-id',
        expectedVersion: formalization.version,
      }),
    ).resolves.toBe(updated)
  })
})
