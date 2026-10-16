import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import { fakeFormalization } from '../../domain/entities/fakers/formalization-faker'
import { fakeFormalizationSignatureArtifact } from '../../domain/entities/fakers/formalization-signature-artifact-faker'
import { fakeFormalizationSignatureProtocol } from '../../domain/entities/fakers/formalization-signature-protocol-faker'
import { fakeFormalizationSignatureRecipient } from '../../domain/entities/fakers/formalization-signature-recipient-faker'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers/formalization-signature-request-faker'
import { fakeFormalizationSignatureRequestDocument } from '../../domain/entities/fakers/formalization-signature-request-document-faker'
import {
  FormalizationContractingConflictError,
  FormalizationContractingNotReadyError,
  FormalizationNotFoundError,
  FormalizationSignatureSendingForbiddenError,
} from '../../domain/errors'
import type {
  FormalizationContractingTransaction,
  FormalizationSignatureArtifactsRepository,
  FormalizationSignatureProtocolsRepository,
  FormalizationSignatureRecipientsRepository,
  FormalizationSignatureRequestDocumentsRepository,
  FormalizationSignatureRequestsRepository,
  FormalizationsRepository,
} from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { ConfirmFormalizationContractingUseCase } from '../confirm-formalization-contracting-use-case'

describe('Confirm Formalization Contracting Use Case', () => {
  function setup() {
    const formalizationsRepository = mock<FormalizationsRepository>()
    const requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    const documentsRepository = mock<FormalizationSignatureRequestDocumentsRepository>()
    const recipientsRepository = mock<FormalizationSignatureRecipientsRepository>()
    const artifactsRepository = mock<FormalizationSignatureArtifactsRepository>()
    const protocolsRepository = mock<FormalizationSignatureProtocolsRepository>()
    const transaction = mock<FormalizationContractingTransaction>()
    const datetimeProvider = mock<DatetimeProvider>()
    const now = new Date('2026-09-01T10:00:00.000Z')
    datetimeProvider.now.mockReturnValue(now)
    return {
      formalizationsRepository,
      requestsRepository,
      documentsRepository,
      recipientsRepository,
      artifactsRepository,
      protocolsRepository,
      transaction,
      datetimeProvider,
      now,
    }
  }

  it('confirms only when the complete request graph is authoritative', async () => {
    const state = setup()
    const formalization = fakeFormalization({ status: 'in_progress', version: 3 })
    const request = fakeFormalizationSignatureRequest({
      id: 'request-1',
      formalizationId: formalization.id,
      status: 'confirmed',
      version: 4,
    })
    const document = fakeFormalizationSignatureRequestDocument({
      id: 'request-document-1',
      requestId: request.id,
      status: 'confirmed',
    })
    const recipient = fakeFormalizationSignatureRecipient({
      id: 'recipient-1',
      requestId: request.id,
      status: 'confirmed',
    })
    const artifact = fakeFormalizationSignatureArtifact({
      requestId: request.id,
      requestDocumentId: document.id,
      kind: 'signed_pdf',
    })
    const protocol = fakeFormalizationSignatureProtocol({
      requestId: request.id,
      recipientId: recipient.id,
    })
    state.formalizationsRepository.findById.mockResolvedValue(formalization)
    state.requestsRepository.findLatestByFormalizationId.mockResolvedValue(request)
    state.documentsRepository.listByRequestId.mockResolvedValue([document])
    state.recipientsRepository.listByRequestId.mockResolvedValue([recipient])
    state.artifactsRepository.findByRequestId.mockResolvedValue([artifact])
    state.protocolsRepository.findByRecipientAndRequest.mockResolvedValue(protocol)
    const result = {
      formalizationId: formalization.id,
      formalizationStatus: 'completed' as const,
      formalizationVersion: 4,
      intakeId: formalization.intakeId,
      intakeStatus: 'contracted' as const,
      intakeVersion: 7,
      contractedAt: state.now,
      duplicate: false,
    }
    state.transaction.confirm.mockResolvedValue({ outcome: 'applied', result })

    await expect(
      new ConfirmFormalizationContractingUseCase(state).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedFormalizationVersion: formalization.version,
        expectedIntakeVersion: 6,
        expectedRequestVersion: request.version,
        confirmationKey: 'confirmation-key',
      }),
    ).resolves.toEqual(result)
    expect(state.transaction.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: request.id, contractedAt: state.now }),
    )
  })

  it('rejects missing prerequisites and never opens the transaction', async () => {
    const state = setup()
    const formalization = fakeFormalization({ status: 'in_progress' })
    const request = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
      status: 'sent',
    })
    state.formalizationsRepository.findById.mockResolvedValue(formalization)
    state.requestsRepository.findLatestByFormalizationId.mockResolvedValue(request)
    await expect(
      new ConfirmFormalizationContractingUseCase(state).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedFormalizationVersion: formalization.version,
        expectedIntakeVersion: 1,
        expectedRequestVersion: request.version,
        confirmationKey: 'confirmation-key',
      }),
    ).rejects.toBeInstanceOf(FormalizationContractingNotReadyError)
    expect(state.transaction.confirm).not.toHaveBeenCalled()
  })

  it('converges same-key completion and rejects a different key', async () => {
    const state = setup()
    const formalization = fakeFormalization({
      status: 'completed',
      contractingConfirmationKey: 'same-key',
      signatureRequestId: 'request-1',
    })
    state.formalizationsRepository.findById.mockResolvedValue(formalization)
    const result = {
      formalizationId: formalization.id,
      formalizationStatus: 'completed' as const,
      formalizationVersion: 2,
      intakeId: formalization.intakeId,
      intakeStatus: 'contracted' as const,
      intakeVersion: 2,
      contractedAt: new Date('2026-09-01T10:00:00.000Z'),
      duplicate: true,
    }
    state.transaction.confirm.mockResolvedValue({ outcome: 'duplicate', result })
    await expect(
      new ConfirmFormalizationContractingUseCase(state).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedFormalizationVersion: formalization.version,
        expectedIntakeVersion: 1,
        expectedRequestVersion: 1,
        confirmationKey: 'same-key',
      }),
    ).resolves.toEqual(result)
    await expect(
      new ConfirmFormalizationContractingUseCase(state).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        expectedFormalizationVersion: formalization.version,
        expectedIntakeVersion: 1,
        expectedRequestVersion: 1,
        confirmationKey: 'different-key',
      }),
    ).rejects.toBeInstanceOf(FormalizationContractingConflictError)
  })
  it.each([
    'missing',
    'unauthorized',
    'cancelled',
    'stale',
    'missing-request',
    'stale-request',
    'missing-documents',
    'unsigned-document',
    'missing-artifact',
    'wrong-artifact-media-type',
    'missing-private-file-id',
    'empty-private-file-id',
    'missing-preserved-at',
    'missing-recipients',
    'pending-recipient',
    'missing-protocol',
    'transaction-conflict',
  ])('rejects %s completion without manufacturing contracting', async (scenario) => {
    const state = setup()
    const formalization = fakeFormalization({
      status: scenario === 'cancelled' ? 'cancelled' : 'in_progress',
    })
    const signatureRequest = fakeFormalizationSignatureRequest({
      formalizationId: formalization.id,
      status: 'confirmed',
    })
    const document = fakeFormalizationSignatureRequestDocument({
      requestId: signatureRequest.id,
      status: scenario === 'unsigned-document' ? 'sent' : 'confirmed',
    })
    const recipient = fakeFormalizationSignatureRecipient({
      requestId: signatureRequest.id,
      status: scenario === 'pending-recipient' ? 'reading' : 'confirmed',
    })
    state.formalizationsRepository.findById.mockResolvedValue(
      scenario === 'missing' ? undefined : formalization,
    )
    state.requestsRepository.findLatestByFormalizationId.mockResolvedValue(
      scenario === 'missing-request' ? null : signatureRequest,
    )
    state.documentsRepository.listByRequestId.mockResolvedValue(
      scenario === 'missing-documents' ? [] : [document],
    )
    state.recipientsRepository.listByRequestId.mockResolvedValue(
      scenario === 'missing-recipients' ? [] : [recipient],
    )
    state.artifactsRepository.findByRequestId.mockResolvedValue(
      scenario === 'missing-artifact'
        ? []
        : [
            fakeFormalizationSignatureArtifact({
              requestId: signatureRequest.id,
              requestDocumentId: document.id,
              kind: 'signed_pdf',
              ...(scenario === 'wrong-artifact-media-type'
                ? { mediaType: 'application/octet-stream' }
                : {}),
              ...(scenario === 'missing-private-file-id'
                ? { privateFileId: undefined as unknown as string }
                : {}),
              ...(scenario === 'empty-private-file-id' ? { privateFileId: '' } : {}),
              ...(scenario === 'missing-preserved-at'
                ? { preservedAt: undefined as unknown as Date }
                : {}),
            }),
          ],
    )
    state.protocolsRepository.findByRecipientAndRequest.mockResolvedValue(
      scenario === 'missing-protocol'
        ? null
        : fakeFormalizationSignatureProtocol({
            requestId: signatureRequest.id,
            recipientId: recipient.id,
          }),
    )
    state.transaction.confirm.mockResolvedValue({ outcome: 'conflict' })
    const command = {
      formalizationId: formalization.id,
      actorId: scenario === 'unauthorized' ? 'stranger' : formalization.assignedLawyerId,
      expectedFormalizationVersion:
        formalization.version + (scenario === 'stale' ? 1 : 0),
      expectedRequestVersion:
        signatureRequest.version + (scenario === 'stale-request' ? 1 : 0),
      expectedIntakeVersion: 1,
      confirmationKey: 'confirmation-key',
    }
    await expect(
      new ConfirmFormalizationContractingUseCase(state).execute(command),
    ).rejects.toBeInstanceOf(
      scenario === 'missing'
        ? FormalizationNotFoundError
        : scenario === 'unauthorized'
          ? FormalizationSignatureSendingForbiddenError
          : ['cancelled', 'stale', 'transaction-conflict'].includes(scenario)
            ? FormalizationContractingConflictError
            : FormalizationContractingNotReadyError,
    )
    if (scenario === 'transaction-conflict')
      expect(state.transaction.confirm).toHaveBeenCalledOnce()
    else expect(state.transaction.confirm).not.toHaveBeenCalled()
  })
})
