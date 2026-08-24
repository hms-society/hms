import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AnchorProps } from '@/ui/shared/widgets/components/anchor'
import { ConsultationTabs } from '../consultation-tabs'

vi.mock('@/ui/shared/widgets/components/anchor', () => ({
  Anchor: ({ children, route, ...props }: AnchorProps) => (
    <a href={`/${route}`} {...props}>
      {children}
    </a>
  ),
}))

describe('ConsultationTabs', () => {
  afterEach(cleanup)

  it('keeps documents unavailable for an intake closed without contract', () => {
    render(
      <ConsultationTabs
        consultationId='consultation-1'
        activeTab='form'
        isDocumentsEnabled={false}
        isDocumentsClosedWithoutContract
      />,
    )

    const documentsTab = screen.getByText('Documentos').parentElement

    expect(documentsTab?.getAttribute('aria-disabled')).toBe('true')
    expect(documentsTab?.getAttribute('title')).toBe(
      'Documentos não disponíveis para consultas encerradas sem contratação.',
    )
    expect(screen.queryByRole('link', { name: 'Documentos' })).toBeNull()
  })

  it('links to documents after the attendance is finalized', () => {
    render(
      <ConsultationTabs
        consultationId='consultation-1'
        activeTab='package'
        isDocumentsEnabled
      />,
    )

    expect(screen.getByRole('link', { name: 'Documentos' })).toBeTruthy()
  })
})
