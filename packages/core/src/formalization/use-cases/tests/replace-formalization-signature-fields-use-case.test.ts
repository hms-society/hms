import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { ReplaceFormalizationSignatureFieldsUseCase } from '../replace-formalization-signature-fields-use-case'
import {
  makeConfiguration,
  makeFormalization,
  TEST_NOW,
} from './signature-configuration-test-helpers'

describe('Replace Formalization Signature Fields Use Case', () => {
  it('rejects a rectangle outside the normalized page bounds', async () => {
    const formalization = makeFormalization()
    const formalizationsRepository = mock<FormalizationsRepository>()
    const repository = mock<FormalizationSignatureConfigurationRepository>()
    formalizationsRepository.findById.mockResolvedValue(formalization)
    repository.findByFormalizationId.mockResolvedValue(
      makeConfiguration({ formalizationId: formalization.id }),
    )
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    await expect(
      new ReplaceFormalizationSignatureFieldsUseCase(
        formalizationsRepository,
        repository,
        sourceReader,
        mock<DatetimeProvider>(),
        mock<IdProvider>(),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        documentId: 'document-id',
        previewId: 'preview-id',
        expectedVersion: formalization.version,
        fields: [
          {
            fieldId: 'field-id',
            signatoryId: 'signatory-id',
            previewId: 'preview-id',
            type: 'signature',
            page: 1,
            positionX: 90,
            positionY: 0,
            width: 20,
            height: 10,
          },
        ],
      }),
    ).rejects.toThrow()
  })

  it('persists a valid field set for a ready preview and assigned signatory', async () => {
    const formalization = makeFormalization()
    const configuration = makeConfiguration({
      formalizationId: formalization.id,
      signatories: [
        { ...makeConfiguration().signatories[0], documentIds: ['document-id'] },
      ],
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
    await expect(
      new ReplaceFormalizationSignatureFieldsUseCase(
        formalizationsRepository,
        repository,
        sourceReader,
        mock<DatetimeProvider>({ now: () => TEST_NOW }),
        mock<IdProvider>({ generate: () => 'assignment-id' }),
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        documentId: 'document-id',
        previewId: 'preview-id',
        expectedVersion: formalization.version,
        fields: [
          {
            fieldId: 'field-id',
            signatoryId: 'signatory-id',
            previewId: 'preview-id',
            type: 'signature',
            page: 1,
            positionX: 10,
            positionY: 10,
            width: 20,
            height: 10,
          },
        ],
      }),
    ).resolves.toBe(configuration)
  })
})
