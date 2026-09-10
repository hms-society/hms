import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { SelectFormalizationSignatoryChannelUseCase } from '../select-formalization-signatory-channel-use-case'
import {
  makeConfiguration,
  makeFormalization,
  makeSignatory,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Select Formalization Signatory Channel Use Case', () => {
  it('revalidates the channel against the current source projection', async () => {
    const formalization = makeFormalization()
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const datetimeProvider = mock<DatetimeProvider>()
    const idProvider = mock<IdProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(
      makeConfiguration({ formalizationId: formalization.id }),
    )
    sourceReader.findPerson.mockResolvedValue({
      personId: 'person-id',
      name: 'Cliente',
      availableChannels: ['whatsapp'],
    })
    sourceReader.listCurrentDocuments.mockResolvedValue([])
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    repository.replaceConfiguration.mockResolvedValue(
      makeConfiguration({ formalizationId: formalization.id }),
    )

    await expect(
      new SelectFormalizationSignatoryChannelUseCase(
        formalizationsRepository,
        repository,
        sourceReader,
        datetimeProvider,
        idProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        signatoryId: 'signatory-id',
        channel: 'whatsapp',
        selected: true,
        expectedVersion: formalization.version,
      }),
    ).resolves.toBeDefined()
    expect(repository.replaceConfiguration).toHaveBeenCalled()
  })

  it('adds and removes channels without replacing the other selections', async () => {
    const formalization = makeFormalization()
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const datetimeProvider = mock<DatetimeProvider>()
    const idProvider = mock<IdProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(
      makeConfiguration({
        formalizationId: formalization.id,
        signatories: [
          makeSignatory({
            selectedChannels: ['email'],
            availableChannels: ['email', 'whatsapp'],
          }),
        ],
      }),
    )
    sourceReader.findPerson.mockResolvedValue({
      personId: 'person-id',
      name: 'Cliente',
      availableChannels: ['email', 'whatsapp'],
    })
    sourceReader.listCurrentDocuments.mockResolvedValue([])
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    repository.replaceConfiguration.mockResolvedValue(
      makeConfiguration({ formalizationId: formalization.id }),
    )

    const useCase = new SelectFormalizationSignatoryChannelUseCase(
      formalizationsRepository,
      repository,
      sourceReader,
      datetimeProvider,
      idProvider,
    )

    await useCase.execute({
      formalizationId: formalization.id,
      actorId: formalization.assignedLawyerId,
      signatoryId: 'signatory-id',
      channel: 'whatsapp',
      selected: true,
      expectedVersion: formalization.version,
    })

    const addedConfiguration = repository.replaceConfiguration.mock.calls[0]?.[0]
    expect(addedConfiguration?.signatories[0]?.selectedChannels).toEqual([
      'email',
      'whatsapp',
    ])

    repository.findByFormalizationId.mockResolvedValue(
      makeConfiguration({
        formalizationId: formalization.id,
        signatories: [
          makeSignatory({
            selectedChannels: ['email', 'whatsapp'],
            availableChannels: ['email', 'whatsapp'],
          }),
        ],
      }),
    )
    await useCase.execute({
      formalizationId: formalization.id,
      actorId: formalization.assignedLawyerId,
      signatoryId: 'signatory-id',
      channel: 'email',
      selected: false,
      expectedVersion: formalization.version,
    })

    const removedConfiguration = repository.replaceConfiguration.mock.calls[1]?.[0]
    expect(removedConfiguration?.signatories[0]?.selectedChannels).toEqual(['whatsapp'])
  })
})
