import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ClientFaker } from '../../domain/entities/fakers'
import type { ClientConsent, ClientConsentCreation } from '../../domain/entities'
import type { ClientConsentsRepository, ClientsRepository } from '../../interfaces'
import type { DatetimeProvider } from '#shared/interfaces'
import { GrantClientConsentUseCase } from '../grant-client-consent-use-case'

describe('GrantClientConsentUseCase', () => {
  let clientsRepository: MockProxy<ClientsRepository>
  let clientConsentsRepository: MockProxy<ClientConsentsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    clientsRepository = mock<ClientsRepository>()
    clientConsentsRepository = mock<ClientConsentsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
  })

  it('grants one consent with the provider timestamp', async () => {
    const client = ClientFaker.fake()
    const grantedAt = new Date('2026-07-27T12:00:00.000Z')
    const createdConsent: ClientConsent = {
      id: 'consent-id',
      clientId: client.id,
      type: 'data_processing',
      grantedAt,
    }
    clientsRepository.findById.mockResolvedValue(client)
    clientConsentsRepository.findActiveByClientIdAndType.mockResolvedValue(undefined)
    datetimeProvider.now.mockReturnValue(grantedAt)
    clientConsentsRepository.add.mockResolvedValue(createdConsent)
    const useCase = new GrantClientConsentUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )

    await expect(
      useCase.execute({ clientId: client.id, type: 'data_processing' }),
    ).resolves.toBe(createdConsent)
    expect(clientConsentsRepository.add).toHaveBeenCalledWith({
      clientId: client.id,
      type: 'data_processing',
      grantedAt,
    } satisfies ClientConsentCreation)
  })

  it('rejects a missing client without inserting', async () => {
    clientsRepository.findById.mockResolvedValue(undefined)
    const useCase = new GrantClientConsentUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )

    await expect(
      useCase.execute({ clientId: 'missing', type: 'data_processing' }),
    ).rejects.toThrow('Cliente não encontrado')
    expect(clientConsentsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects an already active type without inserting', async () => {
    const client = ClientFaker.fake()
    clientsRepository.findById.mockResolvedValue(client)
    clientConsentsRepository.findActiveByClientIdAndType.mockResolvedValue({
      id: 'consent-id',
      clientId: client.id,
      type: 'data_processing',
      grantedAt: new Date(),
    })
    const useCase = new GrantClientConsentUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )

    await expect(
      useCase.execute({ clientId: client.id, type: 'data_processing' }),
    ).rejects.toThrow('já está ativo')
    expect(clientConsentsRepository.add).not.toHaveBeenCalled()
  })

  it('maps an atomic insertion collision to a conflict', async () => {
    const client = ClientFaker.fake()
    clientsRepository.findById.mockResolvedValue(client)
    clientConsentsRepository.findActiveByClientIdAndType.mockResolvedValue(undefined)
    clientConsentsRepository.add.mockResolvedValue(undefined)
    datetimeProvider.now.mockReturnValue(new Date())
    const useCase = new GrantClientConsentUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )

    await expect(
      useCase.execute({ clientId: client.id, type: 'email_communication' }),
    ).rejects.toThrow('já está ativo')
  })
})
