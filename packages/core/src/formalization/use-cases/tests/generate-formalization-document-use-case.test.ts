import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers'
import type { DocumentGenerationsRepository, DocumentPackagesRepository, DocumentSpecificationsRepository, PackageDocumentsRepository } from '../../../document-production/interfaces'
import type { Broker, DatetimeProvider, IdProvider } from '../../../shared/interfaces'
import type { FormalizationSourceReader, FormalizationsRepository } from '../../interfaces'
import { GenerateFormalizationDocumentUseCase } from '../generate-formalization-document-use-case'

describe('Generate Formalization Document Use Case', () => {
  it('blocks generation while the form is open', async () => {
    const formalization = fakeFormalization()
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)
    await expect(
      new GenerateFormalizationDocumentUseCase(
        repository,
        mock<FormalizationSourceReader>(),
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentSpecificationsRepository>(),
        mock<DocumentGenerationsRepository>(),
        mock<Broker>(),
        mock<DatetimeProvider>(),
        mock<IdProvider>(),
      ).execute({ formalizationId: formalization.id, documentId: 'document', actorId: formalization.assignedLawyerId }),
    ).rejects.toThrow('Feche o formulário')
  })

  it('blocks generation for a cancelled Formalization', async () => {
    const formalization = fakeFormalization({
      status: 'cancelled',
      contractFormState: 'closed',
    })
    const repository = mock<FormalizationsRepository>()
    repository.findById.mockResolvedValue(formalization)

    await expect(
      new GenerateFormalizationDocumentUseCase(
        repository,
        mock<FormalizationSourceReader>(),
        mock<DocumentPackagesRepository>(),
        mock<PackageDocumentsRepository>(),
        mock<DocumentSpecificationsRepository>(),
        mock<DocumentGenerationsRepository>(),
        mock<Broker>(),
        mock<DatetimeProvider>(),
        mock<IdProvider>(),
      ).execute({
        formalizationId: formalization.id,
        documentId: 'document',
        actorId: formalization.assignedLawyerId,
      }),
    ).rejects.toThrow('somente leitura')
  })
})
