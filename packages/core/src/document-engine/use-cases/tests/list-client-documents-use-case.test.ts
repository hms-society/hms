import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type {
  ClientDocumentsRepository,
  ClientDocumentOriginsProvider,
} from '../../interfaces'
import { ListClientDocumentsUseCase } from '../list-client-documents-use-case'
import { ClientDocumentFaker } from '../../domain/entities/fakers'
describe('List client documents', () => {
  it('reconciles only currently authorized origins using stable source keys', async () => {
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    const document = ClientDocumentFaker.fake()
    origins.list.mockResolvedValue([document])
    documents.add.mockResolvedValue(document)
    expect(
      await new ListClientDocumentsUseCase(documents, origins).execute({
        clientId: document.clientId,
        actorId: 'actor',
        caseId: 'case',
      }),
    ).toEqual([document])
    expect(documents.add).toHaveBeenCalledWith({
      sourceKey: JSON.stringify([
        'received_file',
        document.source.kind === 'received_file' ? document.source.fileId : '',
      ]),
      origin: document,
    })
    expect(documents.listByClientId).not.toHaveBeenCalled()
  })
  it('reconciles distinct immutable Consulta versions and signed Formalização artifacts without manufacturing received files', async () => {
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    const consultation = ClientDocumentFaker.fake({
      source: {
        kind: 'consultation_version',
        consultationId: 'consulta',
        documentId: 'document',
        versionId: 'version-1',
      },
    })
    const signed = ClientDocumentFaker.fake({
      clientId: consultation.clientId,
      source: {
        kind: 'formalization_signed',
        formalizationId: 'formalizacao',
        requestDocumentId: 'signed-document',
        artifactId: 'signed-pdf',
      },
    })
    origins.list.mockResolvedValue([consultation, signed])
    documents.add.mockResolvedValueOnce(consultation).mockResolvedValueOnce(signed)
    expect(
      await new ListClientDocumentsUseCase(documents, origins).execute({
        clientId: consultation.clientId,
        actorId: 'actor',
        caseId: 'case',
      }),
    ).toEqual([consultation, signed])
    expect(documents.add).toHaveBeenCalledWith({
      sourceKey: JSON.stringify([
        'consultation_version',
        'consulta',
        'document',
        'version-1',
      ]),
      origin: consultation,
    })
    expect(documents.add).toHaveBeenCalledWith({
      sourceKey: JSON.stringify([
        'formalization_signed',
        'formalizacao',
        'signed-document',
        'signed-pdf',
      ]),
      origin: signed,
    })
  })
  it('returns an empty readable collection without inserting release records', async () => {
    const documents = mock<ClientDocumentsRepository>()
    const origins = mock<ClientDocumentOriginsProvider>()
    origins.list.mockResolvedValue([])
    expect(
      await new ListClientDocumentsUseCase(documents, origins).execute({
        clientId: 'client',
        actorId: 'actor',
        caseId: 'case',
      }),
    ).toEqual([])
    expect(documents.add).not.toHaveBeenCalled()
  })
})
