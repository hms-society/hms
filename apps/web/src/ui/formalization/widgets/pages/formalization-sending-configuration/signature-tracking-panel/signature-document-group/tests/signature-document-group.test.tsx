import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  FormalizationSignatureTrackingDocument,
  FormalizationSignatureTrackingSignatory,
} from '@hms/core/formalization/domain/structures'

import { SignatureDocumentGroup } from '..'

vi.mock('../signature-signatory-row', () => ({
  SignatureSignatoryRow: ({ signatory }: { signatory: { displayName: string } }) => (
    <li>{signatory.displayName}</li>
  ),
}))

const first: FormalizationSignatureTrackingSignatory = {
  recipientId: 'recipient-b',
  recipientVersion: 1,
  displayName: 'Bia',
  actorKind: 'client',
  deliveryChannel: 'email',
  status: 'invited',
  canResend: true,
}
const second: FormalizationSignatureTrackingSignatory = {
  recipientId: 'recipient-a',
  recipientVersion: 1,
  displayName: 'Ana',
  actorKind: 'client',
  deliveryChannel: 'email',
  status: 'invited',
  canResend: true,
}
const documentStatus: FormalizationSignatureTrackingDocument = {
  requestDocumentId: 'request-document-1',
  sourceDocumentId: 'document-1',
  title: 'Contrato de honorários',
  position: 1,
  status: 'confirmed',
  signedArtifactAvailable: true,
  signatories: [first, second],
}

describe('SignatureDocumentGroup', () => {
  afterEach(cleanup)

  it('renders document metadata and sorts recipients deterministically', () => {
    render(
      <SignatureDocumentGroup
        document={documentStatus}
        isResending={false}
        onRequestResend={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Contrato de honorários' })).not.toBeNull()
    expect(screen.queryByText('Documento 1')).toBeNull()
    expect(screen.getByText('PDF assinado disponível')).not.toBeNull()
    expect(screen.queryByText('Confirmado')).toBeNull()
    expect(screen.getByRole('list').textContent).toBe('AnaBia')
  })

  it('keeps the empty recipient state explicit', () => {
    render(
      <SignatureDocumentGroup
        document={{ ...documentStatus, signatories: [] }}
        isResending={false}
        onRequestResend={vi.fn()}
      />,
    )

    expect(screen.getByText('Nenhum signatário associado.')).not.toBeNull()
  })

  it('shows the document as signed when every signatory has signed', () => {
    render(
      <SignatureDocumentGroup
        document={{
          ...documentStatus,
          signedArtifactAvailable: false,
          signatories: [
            { ...first, status: 'submitted' },
            { ...second, status: 'confirmed' },
          ],
        }}
        isResending={false}
        onRequestResend={vi.fn()}
      />,
    )

    expect(screen.getByText('Assinado')).not.toBeNull()
    expect(screen.queryByText('Aguardando PDF assinado')).toBeNull()
  })
})
