import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminCaseSummaryPage } from '..'
import { useAdminCaseSummaryPage } from '../use-admin-case-summary-page'

vi.mock('../use-admin-case-summary-page', () => ({ useAdminCaseSummaryPage: vi.fn() }))
vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children }: { children: React.ReactNode }) => (
    <a href='/admin/casos'>{children}</a>
  ),
}))
const query = vi.mocked(useAdminCaseSummaryPage)
afterEach(cleanup)
describe('AdminCaseSummaryPage', () => {
  it('renders persisted metadata and team without mutation controls', () => {
    query.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        title: 'Contrato civil',
        publicCode: 'CASO-001',
        clientName: 'Cliente A',
        legalArea: 'Cível',
        legalTopic: 'Contratos',
        status: 'documentation',
        updatedAt: new Date('2026-10-01'),
        team: [{ collaboratorId: 'member-1', name: 'Maria', role: 'manager' }],
      },
    } as never)
    render(<AdminCaseSummaryPage caseId='case-1' />)
    expect(screen.getByRole('heading', { name: 'Contrato civil' })).toBeDefined()
    expect(screen.getByText('Cliente A')).toBeDefined()
    expect(screen.getByText('Maria')).toBeDefined()
    expect(screen.getByText('Gestor')).toBeDefined()
    expect(screen.getByText('Somente leitura')).toBeDefined()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
  it('shows an error without rendering stale metadata', () => {
    query.mockReturnValue({
      isPending: false,
      isError: true,
      data: { title: 'Dados antigos' },
      refetch: vi.fn(),
    } as never)
    render(<AdminCaseSummaryPage caseId='case-1' />)
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.queryByText('Dados antigos')).toBeNull()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeDefined()
  })
  it('shows loading while metadata is unavailable', () => {
    query.mockReturnValue({ isPending: true } as never)
    render(<AdminCaseSummaryPage caseId='case-1' />)
    expect(screen.getByText('Carregando Caso…')).toBeDefined()
  })
})
