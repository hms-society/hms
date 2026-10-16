import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type { ClientDocumentOriginsProvider } from '../../interfaces'
import type { ResolveClientDocumentUseCase } from '../resolve-client-document-use-case'
import { ReadClientDocumentUseCase } from '../read-client-document-use-case'
import { ClientDocumentFaker } from '../../domain/entities/fakers'
describe('Read client document', () => {
  it('reads the pinned source only after authorized resolution', async () => {
    const resolve = mock<ResolveClientDocumentUseCase>()
    const origins = mock<ClientDocumentOriginsProvider>()
    const document = ClientDocumentFaker.fake()
    const bytes = new Uint8Array([1])
    resolve.execute.mockResolvedValue(document)
    origins.read.mockResolvedValue(bytes)
    const request = {
      clientId: document.clientId,
      actorId: 'actor',
      caseId: 'case',
      documentId: document.id,
    }
    expect(
      await new ReadClientDocumentUseCase(resolve, origins).execute(request),
    ).toEqual({ document, bytes })
    expect(resolve.execute).toHaveBeenCalledWith({ ...request, forSelection: false })
    expect(origins.read).toHaveBeenCalledWith({ ...request, source: document.source })
  })
})
