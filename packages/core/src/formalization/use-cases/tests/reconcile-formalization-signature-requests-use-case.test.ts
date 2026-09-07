import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { FormalizationSignatureReconciliationRequestedEvent } from '../../domain/events'
import { fakeFormalizationSignatureRequest } from '../../domain/entities/fakers/formalization-signature-request-faker'
import type { FormalizationSignatureRequestsRepository } from '../../interfaces'
import type { Broker } from '../../../shared/interfaces'
import { ReconcileFormalizationSignatureRequestsUseCase } from '../reconcile-formalization-signature-requests-use-case'

describe('Reconcile Formalization Signature Requests Use Case', () => {
  let requestsRepository: MockProxy<FormalizationSignatureRequestsRepository>
  let broker: MockProxy<Broker>
  let useCase: ReconcileFormalizationSignatureRequestsUseCase

  beforeEach(() => {
    requestsRepository = mock<FormalizationSignatureRequestsRepository>()
    broker = mock<Broker>()
    useCase = new ReconcileFormalizationSignatureRequestsUseCase({
      requestsRepository,
      broker,
    })
  })

  it('publishes one scheduled reconciliation event for each bounded candidate', async () => {
    const occurredAt = new Date('2026-09-04T15:00:00.000Z')
    const requests = [
      fakeFormalizationSignatureRequest({ id: 'request-1', status: 'in_progress' }),
      fakeFormalizationSignatureRequest({ id: 'request-2', status: 'submitted' }),
    ]
    requestsRepository.listReconcilable.mockResolvedValue(requests)

    const result = await useCase.execute({ limit: 100, occurredAt })

    expect(requestsRepository.listReconcilable).toHaveBeenCalledWith(100)
    expect(broker.publish).toHaveBeenCalledTimes(2)
    expect(broker.publish).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        name: FormalizationSignatureReconciliationRequestedEvent._NAME,
        payload: {
          version: 1,
          requestId: 'request-1',
          reason: 'scheduled',
          earliestRunAt: occurredAt,
        },
      }),
    )
    expect(broker.publish).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: FormalizationSignatureReconciliationRequestedEvent._NAME,
        payload: expect.objectContaining({ requestId: 'request-2' }),
      }),
    )
    expect(result).toEqual({ published: 2 })
  })

  it('completes without publishing when no request needs reconciliation', async () => {
    requestsRepository.listReconcilable.mockResolvedValue([])

    await expect(
      useCase.execute({
        limit: 100,
        occurredAt: new Date('2026-09-04T15:00:00.000Z'),
      }),
    ).resolves.toEqual({ published: 0 })
    expect(broker.publish).not.toHaveBeenCalled()
  })
})
