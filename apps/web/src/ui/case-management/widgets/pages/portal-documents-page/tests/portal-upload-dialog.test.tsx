import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'
import { PortalUploadDialog } from '../portal-upload-dialog'

const item: CaseChecklistItem = {
  id: '00000000-0000-4000-8000-000000000001',
  caseId: '00000000-0000-4000-8000-000000000002',
  templateItemKey: 'identity-document',
  title: 'Documento de identidade',
  isRequired: true,
  status: 'pending',
  createdAt: new Date('2026-09-22T10:00:00.000Z'),
  updatedAt: new Date('2026-09-22T10:00:00.000Z'),
}

describe('PortalUploadDialog', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  function selectFile(file: File) {
    const input = screen.getByLabelText('Selecionar arquivo') as HTMLInputElement
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: [file],
    })
    fireEvent.change(input)
  }

  it('rejects unsupported file formats before submitting', async () => {
    const onSubmit = vi.fn()

    render(
      <PortalUploadDialog
        item={item}
        open
        isUploading={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    selectFile(new File(['document'], 'documento.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar documento' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('Formato inválido. Envie PNG, JPG, JPEG ou PDF.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a valid PDF file', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <PortalUploadDialog
        item={item}
        open
        isUploading={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    const file = new File(['pdf-content'], 'documento.pdf', { type: 'application/pdf' })
    selectFile(file)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar documento' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(file))
  })

  it('rejects files larger than 10 MB before submitting', async () => {
    const onSubmit = vi.fn()

    render(
      <PortalUploadDialog
        item={item}
        open
        isUploading={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    const oversizedFile = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'documento.pdf', {
      type: 'application/pdf',
    })
    selectFile(oversizedFile)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar documento' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('O arquivo deve ter entre 1 byte e 10 MB.')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
