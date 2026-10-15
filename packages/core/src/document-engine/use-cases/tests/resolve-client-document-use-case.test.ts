import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type {
  ClientDocumentsRepository,
  ClientDocumentOriginsProvider,
} from '../../interfaces'
import { ResolveClientDocumentUseCase } from '../resolve-client-document-use-case'
import { ClientDocumentFaker } from '../../domain/entities/fakers'
describe('Resolve client document', () => {
  it('rechecks origin authorization and preserves the exact durable reference', async () => {
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    const document = ClientDocumentFaker.fake()
    documents.findById.mockResolvedValue(document)
    origins.resolve.mockResolvedValue(document)
    const request = {
      clientId: document.clientId,
      actorId: 'actor',
      caseId: 'case',
      documentId: document.id,
      forSelection: false,
    }
    expect(
      await new ResolveClientDocumentUseCase(documents, origins).execute(request),
    ).toBe(document)
    expect(origins.resolve).toHaveBeenCalledWith({ ...request, source: document.source })
  })
  it('rejects a foreign client before source names can leak', async () => {
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    const document = ClientDocumentFaker.fake()
    documents.findById.mockResolvedValue(document)
    await expect(
      new ResolveClientDocumentUseCase(documents, origins).execute({
        clientId: 'foreign',
        actorId: 'actor',
        caseId: 'case',
        documentId: document.id,
        forSelection: true,
      }),
    ).rejects.toThrow()
    expect(origins.resolve).not.toHaveBeenCalled()
  })
  it('rejects a missing collection reference without contacting its source', async () => {
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    documents.findById.mockResolvedValue(undefined)
    await expect(
      new ResolveClientDocumentUseCase(documents, origins).execute({
        clientId: 'client',
        actorId: 'actor',
        caseId: 'case',
        documentId: 'missing',
        forSelection: true,
      }),
    ).rejects.toThrow()
    expect(origins.resolve).not.toHaveBeenCalled()
  })
  it.each([
    'consultation_version',
    'formalization_signed',
  ] as const)('preserves the pinned %s source even when JSON object property order differs', async (kind) => {
    const source =
      kind === 'consultation_version'
        ? {
            kind,
            consultationId: 'consulta',
            documentId: 'document',
            versionId: 'version',
          }
        : {
            kind,
            formalizationId: 'formalizacao',
            requestDocumentId: 'signed-document',
            artifactId: 'artifact',
          }
    const document = ClientDocumentFaker.fake({ source })
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    documents.findById.mockResolvedValue(document)
    const reordered = Object.fromEntries(
      Object.entries(source).reverse(),
    ) as typeof source
    origins.resolve.mockResolvedValue({ ...document, source: reordered })
    expect(
      await new ResolveClientDocumentUseCase(documents, origins).execute({
        clientId: document.clientId,
        actorId: 'actor',
        caseId: 'case',
        documentId: document.id,
        forSelection: false,
      }),
    ).toBe(document)
  })
  it('rejects source reassignment to a foreign client', async () => {
    const document = ClientDocumentFaker.fake()
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    documents.findById.mockResolvedValue(document)
    origins.resolve.mockResolvedValue({ ...document, clientId: 'other-client' })
    await expect(
      new ResolveClientDocumentUseCase(documents, origins).execute({
        clientId: document.clientId,
        actorId: 'actor',
        caseId: 'case',
        documentId: document.id,
        forSelection: true,
      }),
    ).rejects.toThrow()
  })
  it('rejects silently switching the stored reference to a different source version', async () => {
    const document = ClientDocumentFaker.fake({
      source: {
        kind: 'consultation_version',
        consultationId: 'consulta',
        documentId: 'document',
        versionId: 'original',
      },
    })
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    documents.findById.mockResolvedValue(document)
    origins.resolve.mockResolvedValue({
      ...document,
      source: {
        kind: 'consultation_version',
        consultationId: 'consulta',
        documentId: 'document',
        versionId: 'replacement',
      },
    })
    await expect(
      new ResolveClientDocumentUseCase(documents, origins).execute({
        clientId: document.clientId,
        actorId: 'actor',
        caseId: 'case',
        documentId: document.id,
        forSelection: false,
      }),
    ).rejects.toThrow()
  })
})
