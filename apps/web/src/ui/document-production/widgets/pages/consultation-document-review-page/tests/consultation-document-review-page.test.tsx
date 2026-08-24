import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useConsultationDocumentVersionQuery } from '../../../../hooks/use-consultation-document-version-query'
import { useConsultationDocumentsQuery } from '../../../../hooks/use-consultation-documents-query'
import { useCancelConsultationDocumentGenerationAction } from '../../../../hooks/use-cancel-consultation-document-generation-action'
import { useGenerateConsultationDocumentAction } from '../../../../hooks/use-generate-consultation-document-action'
import { useReviewConsultationDocumentVersionAction } from '../../../../hooks/use-review-consultation-document-version-action'
import { useSaveManualConsultationDocumentVersionAction } from '../../../../hooks/use-save-manual-consultation-document-version-action'
import { useSelectCurrentConsultationDocumentVersionAction } from '../../../../hooks/use-select-current-consultation-document-version-action'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import type { DocumentVersion } from '@hms/core/document-production/domain/entities'
import { ConsultationDocumentReviewPage } from '..'

vi.mock('../../../../hooks/use-consultation-document-version-query', () => ({
  useConsultationDocumentVersionQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-consultation-documents-query', () => ({
  useConsultationDocumentsQuery: vi.fn(),
}))
vi.mock('../../../../hooks/use-cancel-consultation-document-generation-action', () => ({
  useCancelConsultationDocumentGenerationAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-generate-consultation-document-action', () => ({
  useGenerateConsultationDocumentAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-review-consultation-document-version-action', () => ({
  useReviewConsultationDocumentVersionAction: vi.fn(),
}))
vi.mock('../../../../hooks/use-save-manual-consultation-document-version-action', () => ({
  useSaveManualConsultationDocumentVersionAction: vi.fn(),
}))
vi.mock(
  '../../../../hooks/use-select-current-consultation-document-version-action',
  () => ({
    useSelectCurrentConsultationDocumentVersionAction: vi.fn(),
  }),
)
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

const useConsultationDocumentVersionQueryMock = vi.mocked(
  useConsultationDocumentVersionQuery,
)
const useConsultationDocumentsQueryMock = vi.mocked(useConsultationDocumentsQuery)
const useCancelConsultationDocumentGenerationActionMock = vi.mocked(
  useCancelConsultationDocumentGenerationAction,
)
const useGenerateConsultationDocumentActionMock = vi.mocked(
  useGenerateConsultationDocumentAction,
)
const useReviewConsultationDocumentVersionActionMock = vi.mocked(
  useReviewConsultationDocumentVersionAction,
)
const useSaveManualConsultationDocumentVersionActionMock = vi.mocked(
  useSaveManualConsultationDocumentVersionAction,
)
const useSelectCurrentConsultationDocumentVersionActionMock = vi.mocked(
  useSelectCurrentConsultationDocumentVersionAction,
)
const useNavigationMock = vi.mocked(useNavigation)
const saveManualVersionMock = vi.fn()

const content = {
  type: 'doc' as const,
  content: [
    {
      type: 'paragraph' as const,
      attrs: { textAlign: null },
      content: [{ type: 'text' as const, text: 'Contrato {{nome_cliente}}' }],
    },
  ],
}

function createVersion(overrides: Record<string, unknown> = {}) {
  return {
    id: 'version-2',
    documentId: 'document-1',
    fileId: 'file-1',
    versionNumber: 2,
    source: 'ai' as const,
    content,
    pendingMarkers: [{ marker: '{{nome_cliente}}' }],
    createdByCollaboratorId: 'collaborator-1',
    createdAt: new Date('2026-08-13T12:00:00.000Z'),
    status: 'in_review' as const,
    ...overrides,
  } as unknown as DocumentVersion
}

function createListItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'document-1',
    title: 'Contrato de honorários',
    currentVersionId: undefined,
    versions: [
      {
        id: 'version-2',
        versionNumber: 2,
        source: 'ai' as const,
        status: 'in_review' as const,
        pendingMarkersCount: 1,
        createdByCollaboratorId: 'collaborator-1',
        createdAt: '2026-08-13T12:00:00.000Z',
      },
      {
        id: 'version-1',
        versionNumber: 1,
        source: 'manual' as const,
        status: 'rejected' as const,
        pendingMarkersCount: 0,
        createdByCollaboratorId: 'collaborator-1',
        createdAt: '2026-08-12T12:00:00.000Z',
        rejectionReason: 'Ajustar a qualificação.',
      },
    ],
    ...overrides,
  }
}

function createQueryResult(overrides: Record<string, unknown> = {}) {
  return {
    data: [createListItem()],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function renderPage() {
  return render(
    <ConsultationDocumentReviewPage
      consultationId='consultation-1'
      documentId='document-1'
      documentVersionId='version-2'
    />,
  )
}

describe('ConsultationDocumentReviewPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    saveManualVersionMock.mockResolvedValue({
      body: createVersion({ id: 'version-3', versionNumber: 3 }),
    })
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    })
    useConsultationDocumentsQueryMock.mockReturnValue(createQueryResult() as never)
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue({
      cancelDocumentGeneration: vi.fn().mockResolvedValue({}),
      error: null,
      isCancellingDocument: false,
    } as never)
    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: createVersion(),
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    })
    useGenerateConsultationDocumentActionMock.mockReturnValue({
      generateDocument: vi.fn().mockResolvedValue({}),
      error: null,
      isGeneratingDocument: false,
      pendingDocumentIds: [],
      timedOutDocumentIds: [],
    } as never)
    useReviewConsultationDocumentVersionActionMock.mockReturnValue({
      reviewVersion: vi
        .fn()
        .mockResolvedValue({ body: createVersion({ status: 'approved' }) }),
      reviewedVersion: undefined,
      reviewVersionError: null,
      isReviewingVersion: false,
      isReviewVersionSuccess: false,
      isReviewVersionConflict: false,
    })
    useSaveManualConsultationDocumentVersionActionMock.mockReturnValue({
      saveManualVersion: saveManualVersionMock,
      savedManualVersion: undefined,
      saveManualVersionError: null,
      isSavingManualVersion: false,
      isSaveManualVersionSuccess: false,
      isSaveManualVersionConflict: false,
    })
    useSelectCurrentConsultationDocumentVersionActionMock.mockReturnValue({
      selectCurrentVersion: vi.fn().mockResolvedValue({ body: {} }),
      selectedCurrentDocument: undefined,
      selectCurrentVersionError: null,
      isSelectingCurrentVersion: false,
      isSelectCurrentVersionSuccess: false,
      isSelectCurrentVersionConflict: false,
    })
  })

  it('renders the real review composition and decision actions for an in-review version', async () => {
    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Revisar documento' })).toBeDefined(),
    )
    expect(screen.getByText('Contrato de honorários')).toBeDefined()
    expect(screen.getAllByText('Em revisão')).toHaveLength(1)
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{2,4}.*\d{2}:\d{2}/)).toBeDefined()
    expect(screen.getByRole('region', { name: 'Decisão da versão' })).toBeDefined()
    expect(screen.getByRole('region', { name: 'Documento em revisão' })).toBeDefined()
    expect(screen.queryByRole('heading', { name: 'Documento em revisão' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Aprovar versão' }).className).toContain(
      'rounded-full',
    )
    expect(screen.getByRole('button', { name: 'Rejeitar versão' }).className).toContain(
      'rounded-full',
    )
    expect(screen.getByRole('button', { name: /Pendências \(1\)/ })).toBeDefined()
    expect(screen.getByRole('textbox', { name: 'Conteúdo da versão 2' })).toBeDefined()
    expect(
      screen.queryByText(
        /remover pendência|baixar|download|instruções|falha na geração/i,
      ),
    ).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Rejeitar versão' }))
    const dialog = await screen.findByRole('dialog', { name: 'Rejeitar versão' })
    expect(
      within(dialog).getByText(/Esta versão permanecerá no histórico como rejeitada\./),
    ).toBeDefined()
    expect(
      within(dialog).getByText('O motivo ficará registrado no histórico.'),
    ).toBeDefined()
    expect(within(dialog).getByLabelText('Motivo da rejeição *')).toBeDefined()
    expect(
      within(dialog)
        .getByRole('button', { name: 'Rejeitar versão' })
        .hasAttribute('disabled'),
    ).toBe(true)
    fireEvent.change(within(dialog).getByLabelText('Motivo da rejeição *'), {
      target: { value: 'Ajustar a qualificação das partes.' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rejeitar versão' }))

    expect(
      useReviewConsultationDocumentVersionActionMock.mock.results[0]?.value.reviewVersion,
    ).toHaveBeenCalledWith({
      consultationId: 'consultation-1',
      documentId: 'document-1',
      documentVersionId: 'version-2',
      request: {
        decision: 'rejected',
        rejectionReason: 'Ajustar a qualificação das partes.',
      },
    })
  })

  it('renders the version history as a linear comparison list', async () => {
    const navigateToMock = vi.fn().mockResolvedValue(undefined)
    useNavigationMock.mockReturnValue({
      navigateTo: navigateToMock,
      navigateCollaboratorsSearch: vi.fn().mockResolvedValue(undefined),
    })
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [createListItem({ currentVersionId: 'version-2' })],
      }) as never,
    )

    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Ver versões' })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ver versões' }))

    const dialog = await screen.findByRole('dialog', {
      name: 'Histórico de versões',
    })
    expect(
      within(dialog).getByText(
        'Contrato de honorários · consulte e compare as versões deste documento.',
      ),
    ).toBeDefined()
    expect(within(dialog).getByText('Versão 2')).toBeDefined()
    expect(within(dialog).getByText('Versão 1')).toBeDefined()
    expect(within(dialog).getByText('Vigente')).toBeDefined()
    expect(within(dialog).getAllByRole('button', { name: 'Visualizar' })).toHaveLength(2)

    fireEvent.click(within(dialog).getAllByRole('button', { name: 'Visualizar' })[1])

    expect(navigateToMock).toHaveBeenCalledWith('consultationDocumentVersion', {
      params: {
        consultationId: 'consultation-1',
        documentId: 'document-1',
        documentVersionId: 'version-1',
      },
    })
  })

  it('shows only the current-version action for a non-current approved version', async () => {
    const approvedVersion = createVersion({ status: 'approved' })
    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: approvedVersion,
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    })
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [createListItem({ currentVersionId: 'version-1' })],
      }) as never,
    )

    renderPage()
    await waitFor(() => expect(screen.getAllByText('Aprovado')).toHaveLength(1))
    expect(screen.getByRole('button', { name: 'Tornar vigente' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Aprovar versão' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Rejeitar versão' })).toBeNull()
    expect(screen.queryByText('Vigente')).toBeNull()
  })

  it('renders the generating decision state and delegates cancellation', async () => {
    const cancelDocumentGenerationMock = vi.fn().mockResolvedValue({})
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [createListItem({ generationStatus: 'running' })],
      }) as never,
    )
    useCancelConsultationDocumentGenerationActionMock.mockReturnValue({
      cancelDocumentGeneration: cancelDocumentGenerationMock,
      error: null,
      isCancellingDocument: false,
    } as never)

    renderPage()

    await waitFor(() => expect(screen.getByText('Geração do documento')).toBeDefined())
    expect(screen.getByText('Gerando')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Cancelar geração' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Aprovar versão' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar geração' }))

    expect(cancelDocumentGenerationMock).toHaveBeenCalledWith('document-1')
    await waitFor(() => expect(screen.queryByText('Geração do documento')).toBeNull())
  })

  it('shows generating immediately from the optimistic mutation state', async () => {
    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: createVersion({ status: 'approved' }),
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    })
    useGenerateConsultationDocumentActionMock.mockReturnValue({
      generateDocument: vi.fn().mockResolvedValue({}),
      error: null,
      isGeneratingDocument: false,
      pendingDocumentIds: ['document-1'],
      timedOutDocumentIds: [],
    } as never)

    renderPage()

    await waitFor(() => expect(screen.getByText('Geração do documento')).toBeDefined())
    expect(screen.getByText('Gerando')).toBeDefined()
  })

  it('renders the failed generation state with retry only', async () => {
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [createListItem({ generationStatus: 'failed' })],
      }) as never,
    )

    renderPage()

    await waitFor(() => expect(screen.getByText('Falha na geração')).toBeDefined())
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Ver erro' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Aprovar versão' })).toBeNull()
  })

  it('opens the new-version dialog with the adjusted confirmation layout', async () => {
    renderPage()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Gerar nova versão' })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gerar nova versão' }))

    const dialog = await screen.findByRole('alertdialog', {
      name: 'Gerar nova versão',
    })
    expect(
      within(dialog).getByText(
        'Descreva o que deve mudar. A IA criará uma nova versão e manterá a versão atual no histórico.',
      ),
    ).toBeDefined()
    const instructions = within(dialog).getByRole('textbox', {
      name: 'Instruções para a nova versão *',
    })
    expect(
      within(dialog)
        .getByRole('button', { name: 'Gerar nova versão' })
        .hasAttribute('disabled'),
    ).toBe(true)
    expect(
      within(dialog).getByRole('button', { name: 'Cancelar' }).hasAttribute('disabled'),
    ).toBe(false)
    fireEvent.change(instructions, {
      target: { value: 'Atualizar a qualificação das partes.' },
    })
    expect(
      within(dialog).getByRole('button', { name: 'Fechar geração de nova versão' }),
    ).toBeDefined()
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeDefined()
    expect(
      within(dialog).getByRole('button', { name: 'Gerar nova versão' }),
    ).toBeDefined()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gerar nova versão' }))
    expect(
      useGenerateConsultationDocumentActionMock.mock.results[0]?.value.generateDocument,
    ).toHaveBeenCalledWith({
      documentId: 'document-1',
      instructions: 'Atualizar a qualificação das partes.',
    })

    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('renders the rejected decision state without approval actions', async () => {
    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: createVersion({
        status: 'rejected',
        rejectionReason: 'Ajustar a qualificação.',
      }),
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    })

    renderPage()

    await waitFor(() => expect(screen.getAllByText('Rejeitado')).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: 'Ver motivo' }))
    const reasonDialog = await screen.findByRole('dialog', {
      name: 'Motivo da rejeição',
    })
    const reasonField = within(reasonDialog).getByRole('textbox', {
      name: 'Motivo da rejeição',
    })
    expect(reasonField).toBeDefined()
    expect(reasonField.getAttribute('readonly')).not.toBeNull()
    expect((reasonField as HTMLTextAreaElement).value).toBe('Ajustar a qualificação.')
    fireEvent.click(
      within(reasonDialog).getByRole('button', { name: 'Fechar motivo da rejeição' }),
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Motivo da rejeição' })).toBeNull(),
    )
    expect(screen.queryByRole('button', { name: 'Aprovar versão' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Rejeitar versão' })).toBeNull()
  })

  it('renders the current approved state and manual editing state', async () => {
    useConsultationDocumentsQueryMock.mockReturnValue(
      createQueryResult({
        data: [createListItem({ currentVersionId: 'version-2' })],
      }) as never,
    )
    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: createVersion({ status: 'approved' }),
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    })

    renderPage()

    await waitFor(() => expect(screen.getByText('Versão aprovada')).toBeDefined())
    expect(screen.getByText('Vigente')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Tornar vigente' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Editar versão' }))

    expect(
      screen.getByText(
        'As alterações ainda não foram salvas. Salvar cria uma nova versão Em revisão.',
      ),
    ).toBeDefined()
    expect(screen.getByRole('button', { name: 'Salvar edição manual' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Cancelar edição' })).toBeDefined()
  })

  it('locates a present marker and explains when a marker is absent', async () => {
    renderPage()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Pendências/ })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: /Pendências/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Pendências do documento' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Localizar' }))
    expect(screen.queryByRole('dialog', { name: 'Marcador não encontrado' })).toBeNull()

    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: createVersion({ content: { type: 'doc', content: [] } }),
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    })
    cleanup()
    renderPage()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Pendências/ })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: /Pendências/ }))
    fireEvent.click(
      within(
        await screen.findByRole('dialog', { name: 'Pendências do documento' }),
      ).getByRole('button', { name: 'Localizar' }),
    )
    expect(
      await screen.findByRole('dialog', { name: 'Marcador não encontrado' }),
    ).toBeDefined()
    expect(screen.getByText(/não será removida/i)).toBeDefined()
  })

  it('removes an individual pending marker from the draft', async () => {
    renderPage()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Pendências/ })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: /Pendências/ }))

    const dialog = await screen.findByRole('dialog', { name: 'Pendências do documento' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remover' }))

    await waitFor(() => {
      expect(screen.queryByText('{{nome_cliente}}')).toBeNull()
      expect(screen.queryByRole('dialog', { name: 'Pendências do documento' })).toBeNull()
    })
    expect(saveManualVersionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        consultationId: 'consultation-1',
        documentId: 'document-1',
        sourceDocumentVersionId: 'version-2',
        content: expect.objectContaining({
          content: [
            expect.objectContaining({
              content: [expect.objectContaining({ text: 'Contrato ' })],
            }),
          ],
        }),
      }),
    )
    expect(useNavigationMock().navigateTo).toHaveBeenCalledWith(
      'consultationDocumentVersion',
      expect.objectContaining({
        params: expect.objectContaining({ documentVersionId: 'version-3' }),
      }),
    )
  })

  it('removes all pending markers from the draft', async () => {
    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: createVersion({
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Contrato {{nome_cliente}} em {{endereco_comercial}}',
                },
              ],
            },
          ],
        },
        pendingMarkers: [
          { marker: '{{nome_cliente}}' },
          { marker: '{{endereco_comercial}}' },
        ],
      }),
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    })

    renderPage()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Pendências \(2\)/ })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: /Pendências \(2\)/ }))

    const dialog = await screen.findByRole('dialog', { name: 'Pendências do documento' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remover todas' }))

    await waitFor(() => {
      expect(screen.queryByText('{{nome_cliente}}')).toBeNull()
      expect(screen.queryByText('{{endereco_comercial}}')).toBeNull()
      expect(screen.queryByRole('dialog', { name: 'Pendências do documento' })).toBeNull()
    })
  })

  it('renders the recovery state when the requested version is not in the document history', async () => {
    useConsultationDocumentVersionQueryMock.mockReturnValue({
      documentVersion: createVersion({ id: 'version-outside-document' }),
      documentVersionError: null,
      isLoadingDocumentVersion: false,
      isFetchingDocumentVersion: false,
      isSuccess: true,
      refetch: vi.fn().mockResolvedValue(undefined),
    })

    renderPage()
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Versão não encontrada' }),
      ).toBeDefined(),
    )
    expect(screen.getByRole('button', { name: /Voltar aos documentos/ })).toBeDefined()
    expect(screen.queryByText('Contrato de honorários')).toBeNull()
  })
})
