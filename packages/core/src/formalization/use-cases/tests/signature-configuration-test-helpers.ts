import type { Formalization } from '../../domain/entities'
import type {
  FormalizationSignatureConfiguration,
  FormalizationSignatureDocumentView,
  FormalizationSignaturePreviewView,
  FormalizationSignatureSignatoryView,
} from '../../domain/structures'
import { fakeFormalization } from '../../domain/entities/fakers'

export const TEST_NOW = new Date('2026-08-26T12:00:00.000Z')

export function makeFormalization(overrides: Partial<Formalization> = {}): Formalization {
  return fakeFormalization({
    contractFormState: 'closed',
    documentsConfirmedAt: TEST_NOW,
    contractFormRevision: 1,
    ...overrides,
  })
}

export function makeSignatory(
  overrides: Partial<FormalizationSignatureSignatoryView> = {},
): FormalizationSignatureSignatoryView {
  return {
    signatoryId: 'signatory-id',
    personId: 'person-id',
    role: 'client',
    name: 'Cliente',
    removable: false,
    availableChannels: ['email'],
    selectedChannels: [],
    documentIds: [],
    ...overrides,
  }
}

export function makePreview(
  overrides: Partial<FormalizationSignaturePreviewView> = {},
): FormalizationSignaturePreviewView {
  return {
    previewId: 'preview-id',
    state: 'ready',
    pageCount: 1,
    pages: [{ page: 1, width: 612, height: 792 }],
    ...overrides,
  }
}

export function makeDocument(
  overrides: Partial<FormalizationSignatureDocumentView> = {},
): FormalizationSignatureDocumentView {
  return {
    documentId: 'document-id',
    documentVersionId: 'version-id',
    name: 'Contrato',
    reviewStatus: 'approved',
    preview: makePreview(),
    fields: [],
    ...overrides,
  }
}

export function makeConfiguration(
  overrides: Partial<FormalizationSignatureConfiguration> = {},
): FormalizationSignatureConfiguration {
  return {
    formalizationId: 'formalization-id',
    version: 1,
    editable: true,
    status: 'configuring',
    previewPreparation: { total: 1, pending: 0, processing: 0, ready: 1, failed: 0 },
    signatories: [makeSignatory()],
    documents: [makeDocument()],
    readiness: { ready: false, assignmentCount: 0, issues: [] },
    ...overrides,
  }
}
