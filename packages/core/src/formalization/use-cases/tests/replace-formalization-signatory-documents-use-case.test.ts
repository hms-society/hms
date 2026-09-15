import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceProvider,
  FormalizationsRepository,
} from '../../interfaces'
import { ReplaceFormalizationSignatoryDocumentsUseCase } from '../replace-formalization-signatory-documents-use-case'
import {
  makeConfiguration,
  makeFormalization,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Replace Formalization Signatory Documents Use Case', () => {
  it('replaces the selected document set through aggregate CAS', async () => {
    const formalization = makeFormalization()
    const configuration = makeConfiguration({ formalizationId: formalization.id })
    const updated = makeConfiguration({ formalizationId: formalization.id })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    const sourceProvider = mock<FormalizationSignatureSourceProvider>()
    const datetimeProvider = mock<DatetimeProvider>()
    const idProvider = mock<IdProvider>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(configuration)
    sourceProvider.listCurrentDocuments.mockResolvedValue([
      {
        documentId: 'document-id',
        documentVersionId: 'version-id',
        name: 'Contrato',
        reviewStatus: 'approved',
        documentSpecificationId: 'specification-1',
        fileId: 'file-id',
      },
    ])
    datetimeProvider.now.mockReturnValue(TEST_NOW)
    idProvider.generate.mockReturnValue('assignment-id')
    repository.replaceConfiguration.mockResolvedValue(updated)

    await expect(
      new ReplaceFormalizationSignatoryDocumentsUseCase(
        formalizationsRepository,
        repository,
        sourceProvider,
        datetimeProvider,
        idProvider,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        signatoryId: 'signatory-id',
        documentIds: ['document-id'],
        expectedVersion: formalization.version,
      }),
    ).resolves.toBe(updated)
    expect(repository.replaceConfiguration).toHaveBeenCalledWith(
      expect.objectContaining({ expectedFormalizationVersion: formalization.version }),
    )
  })
})
