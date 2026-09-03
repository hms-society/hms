import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { ResetFormalizationSignatureConfigurationUseCase } from '../reset-formalization-signature-configuration-use-case'
import {
  makeConfiguration,
  makeFormalization,
  makeSignatory,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Reset Formalization Signature Configuration Use Case', () => {
  it('requires destructive confirmation', async () => {
    const formalization = makeFormalization()
    const formalizationsRepository = mock<FormalizationsRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    await expect(
      new ResetFormalizationSignatureConfigurationUseCase(
        formalizationsRepository,
        mock<FormalizationSignatureConfigurationRepository>(),
        mock<FormalizationSignatureSourceReader>(),
        mock<DatetimeProvider>(),
        mock<IdProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
        confirmed: false,
      }),
    ).rejects.toThrow('confirmação destrutiva')
  })

  it('retains only empty default signatories and clears fields', async () => {
    const formalization = makeFormalization()
    const additional = makeSignatory({
      signatoryId: 'additional',
      role: 'additional_collaborator',
      removable: true,
      profile: 'lawyer',
    })
    const configuration = makeConfiguration({
      formalizationId: formalization.id,
      signatories: [makeSignatory({ documentIds: ['document-id'] }), additional],
    })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(configuration)
    sourceReader.listCurrentDocuments.mockResolvedValue([
      {
        documentId: 'document-id',
        documentVersionId: 'version-id',
        name: 'Contrato',
        reviewStatus: 'approved',
        fileId: 'file-id',
      },
    ])
    repository.replaceConfiguration.mockResolvedValue(configuration)
    const datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    await expect(
      new ResetFormalizationSignatureConfigurationUseCase(
        formalizationsRepository,
        repository,
        sourceReader,
        datetimeProvider,
        mock<IdProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedVersion: formalization.version,
        confirmed: true,
      }),
    ).resolves.toBe(configuration)
    expect(repository.replaceConfiguration).toHaveBeenCalled()
  })
})
