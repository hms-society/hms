import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CasoDetalheChecklistPage } from '..'
import { useMyCasePage } from '../use-my-case-page'

vi.mock('../use-my-case-page', () => ({ useMyCasePage: vi.fn() }))
vi.mock('../case-page-header', () => ({
  CasePageHeader: ({
    isAdministrator,
    onOpenPortal,
  }: {
    isAdministrator: boolean
    onOpenPortal: () => void
  }) =>
    isAdministrator ? null : (
      <button type='button' onClick={onOpenPortal}>
        Open portal access
      </button>
    ),
}))
vi.mock('../case-tab-navigation', () => ({ CaseTabNavigation: () => null }))
vi.mock('../case-tab-panels', () => ({ CaseTabPanels: () => null }))
vi.mock('../portal-access-dialog', () => ({
  PortalAccessDialog: ({
    open,
    onOpenChange,
  }: {
    open: boolean
    onOpenChange: (open: boolean) => void
  }) =>
    open ? (
      <button type='button' onClick={() => onOpenChange(false)}>
        Close portal access
      </button>
    ) : null,
}))

const useMyCasePageMock = vi.mocked(useMyCasePage)

describe('CasoDetalheChecklistPage portal access', () => {
  const handleClosePortalAccessDialogMock = vi.fn()
  const setSelectedThirdPartyIdMock = vi.fn()

  beforeEach(() => {
    handleClosePortalAccessDialogMock.mockReset()
    setSelectedThirdPartyIdMock.mockReset()
    useMyCasePageMock.mockReturnValue({
      activeTab: 'visao-geral',
      caseDetails: { id: 'case-1', title: 'Case title', team: [] },
      caseUuid: 'case-1',
      checklistItems: [],
      completionPercentage: 0,
      handleClosePortalAccessDialog: handleClosePortalAccessDialogMock,
      handleCopyPortalLink: vi.fn(),
      handleGeneratePortalLink: vi.fn(),
      handleOpenChecklistTab: vi.fn(),
      isGeneratingPortalLink: false,
      mandatoryItemsCount: 0,
      pendingItemsCount: 0,
      portalAccessExpiresAt: null,
      portalAccessUrl: null,
      selectedThirdPartyId: '',
      setCanViewCaseStatus: vi.fn(),
      setCanViewIntakeStatus: vi.fn(),
      setCanUpload: vi.fn(),
      setSelectedThirdPartyId: setSelectedThirdPartyIdMock,
      setActiveTab: vi.fn(),
      thirdParties: [],
      validatedItemsCount: 0,
    } as never)
  })

  it('opens and closes portal access for legal users and hides it from Admin', () => {
    const { rerender } = render(<CasoDetalheChecklistPage caseId='case-1' />)

    fireEvent.click(screen.getByRole('button', { name: 'Open portal access' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close portal access' }))
    expect(handleClosePortalAccessDialogMock).toHaveBeenCalledOnce()
    expect(setSelectedThirdPartyIdMock).toHaveBeenCalledWith('')

    rerender(<CasoDetalheChecklistPage caseId='case-1' isAdministrator />)
    expect(screen.queryByRole('button', { name: 'Open portal access' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Close portal access' })).toBeNull()
  })
})
