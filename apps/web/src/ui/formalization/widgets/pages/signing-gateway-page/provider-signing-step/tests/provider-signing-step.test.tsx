import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProviderSigningStep } from '../index'
import { useProviderSigningStep } from '../use-provider-signing-step'

vi.mock('../use-provider-signing-step', () => ({ useProviderSigningStep: vi.fn() }))

describe('ProviderSigningStep', () => {
  afterEach(cleanup)

  it('only exposes the HMS-relative provider proxy path', () => {
    vi.mocked(useProviderSigningStep).mockReturnValue({
      handleSubmitted: vi.fn(),
      handleUnavailable: vi.fn(),
    })
    render(
      <ProviderSigningStep
        proxyPath='/assinaturas/provedor/session-1'
        title='Contrato'
        onSubmitted={vi.fn()}
        onUnavailable={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('link', { name: 'Continuar no documento' }).getAttribute('href'),
    ).toBe('/assinaturas/provedor/session-1')
  })
})
