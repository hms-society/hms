import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RequestResendModal } from '..'
import { useRequestResendModal } from '../use-request-resend-modal'

vi.mock('../use-request-resend-modal', () => ({
  useRequestResendModal: vi.fn(),
}))

const useRequestResendModalMock = vi.mocked(useRequestResendModal)

describe('RequestResendModal', () => {
  beforeEach(() => {
    useRequestResendModalMock.mockReturnValue({
      message: 'Mensagem inicial',
      handleMessageChange: vi.fn(),
      handleSend: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('allows editing and sending the message to the recipient', async () => {
    const handleMessageChange = vi.fn()
    const handleSend = vi.fn()
    useRequestResendModalMock.mockReturnValue({
      message: 'Mensagem inicial',
      handleMessageChange,
      handleSend,
    })

    render(
      <RequestResendModal
        isOpen
        onClose={vi.fn()}
        recipientName='Mariana Costa Silva'
        recipientContact='mariana@example.com'
        onSend={vi.fn()}
      />,
    )

    const messageField = await screen.findByRole('textbox')
    fireEvent.change(messageField, { target: { value: 'Envie o verso do documento.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitação' }))

    await waitFor(() =>
      expect(handleMessageChange).toHaveBeenCalledWith('Envie o verso do documento.'),
    )
    expect(handleSend).toHaveBeenCalledTimes(1)
  })
})
