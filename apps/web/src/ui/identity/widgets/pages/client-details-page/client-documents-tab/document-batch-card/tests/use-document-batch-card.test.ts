import { act, renderHook } from '@testing-library/react'
import { DocumentValidationStatus } from '@hms/core/document-engine/domain/structures'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { DocumentBatchFile } from '@hms/core/document-engine/domain/entities'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useDocumentBatchCard } from '../use-document-batch-card'

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useNavigationMock = vi.mocked(useNavigation)

describe('useDocumentBatchCard', () => {
  const navigateTo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
  })

  it('maps document validation statuses to client document labels', () => {
    const { result } = renderHook(() => useDocumentBatchCard())

    expect(
      result.current.getFileStatus(createFile(DocumentValidationStatus.Processing)),
    ).toMatchObject({ label: 'Em processamento' })
    expect(
      result.current.getFileStatus(
        createFile(DocumentValidationStatus.AwaitingValidation),
      ),
    ).toMatchObject({ label: 'Aguardando validação' })
    expect(
      result.current.getFileStatus(createFile(DocumentValidationStatus.Valid)),
    ).toMatchObject({ label: 'Validado' })
    expect(
      result.current.getFileStatus(createFile(DocumentValidationStatus.NotLinked)),
    ).toMatchObject({ label: 'Não vinculado' })
    expect(
      result.current.getFileStatus(createFile(DocumentValidationStatus.Illegible)),
    ).toMatchObject({ label: 'Ilegível' })
    expect(
      result.current.getFileStatus(createFile(DocumentValidationStatus.Incomplete)),
    ).toMatchObject({ label: 'Incompleto' })
    expect(
      result.current.getFileStatus(createFile(DocumentValidationStatus.Duplicate)),
    ).toMatchObject({ label: 'Duplicado' })
    expect(
      result.current.getFileStatus(
        createFile(DocumentValidationStatus.NotCorresponding),
      ),
    ).toMatchObject({ label: 'Não correspondente' })
    expect(
      result.current.getFileStatus(
        createFile(DocumentValidationStatus.ProcessingFailure),
      ),
    ).toMatchObject({ label: 'Falha no processamento' })
    expect(
      result.current.getFileStatus(
        createFile(DocumentValidationStatus.ResendRequested),
      ),
    ).toMatchObject({ label: 'Reenvio solicitado' })
  })

  it('opens the document analysis page from a client batch file', () => {
    const { result } = renderHook(() => useDocumentBatchCard())

    act(() => {
      result.current.handleViewFile('file-1')
    })

    expect(navigateTo).toHaveBeenCalledWith('documentAnalysis', {
      params: { fileId: 'file-1' },
    })
  })
})

function createFile(status: DocumentValidationStatus): DocumentBatchFile {
  return {
    id: 'file-1',
    batchId: 'batch-1',
    storagePath: 'internal/documento.pdf',
    originalName: 'documento.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 2048,
    status,
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
  }
}
