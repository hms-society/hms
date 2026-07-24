import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ClientFaker } from '../../domain/entities/fakers'
import type { ClientConsentsRepository, ClientsRepository } from '../../interfaces'
import type { DatetimeProvider } from '#shared/interfaces'
import { RegisterClientUseCase } from '../register-client-use-case'

describe('Register Client Use Case', () => {
  let clientsRepository: MockProxy<ClientsRepository>
  let clientConsentsRepository: MockProxy<ClientConsentsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>

  beforeEach(() => {
    clientsRepository = mock<ClientsRepository>()
    clientConsentsRepository = mock<ClientConsentsRepository>()
    datetimeProvider = mock<DatetimeProvider>()
  })

  it('registers a natural client with its granted consents', async () => {
    const client = ClientFaker.fake({
      taxId: { type: 'cpf', value: '12345678900' },
    })
    const grantedAt = new Date('2026-07-24T12:00:00.000Z')
    const consents = [
      {
        id: 'consent-id',
        clientId: client.id,
        type: 'data_processing' as const,
        grantedAt,
      },
    ]
    clientsRepository.findByTaxId.mockResolvedValue(undefined)
    clientsRepository.add.mockResolvedValue(client)
    clientConsentsRepository.addMany.mockResolvedValue(consents)
    datetimeProvider.now.mockReturnValue(grantedAt)
    const useCase = new RegisterClientUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        type: 'natural',
        name: 'Ricardo Alves de Souza',
        taxId: '123.456.789-00',
        phone: '(12) 99876-3322',
        consents: ['data_processing'],
      }),
    ).resolves.toEqual({ client, consents })

    expect(clientsRepository.add).toHaveBeenCalledWith({
      type: 'natural',
      name: 'Ricardo Alves de Souza',
      taxId: { type: 'cpf', value: '12345678900' },
      phone: '12998763322',
      email: undefined,
      address: undefined,
    })
    expect(clientConsentsRepository.addMany).toHaveBeenCalledWith([
      { clientId: client.id, type: 'data_processing', grantedAt },
    ])
  })

  it('fails when the tax id is already registered', async () => {
    clientsRepository.findByTaxId.mockResolvedValue(ClientFaker.fake())
    const useCase = new RegisterClientUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        type: 'natural',
        name: 'Maria Aparecida dos Santos',
        taxId: '12345678900',
      }),
    ).rejects.toThrow('Já existe um cliente cadastrado com o documento informado.')
  })

  it('registers a legal client without consents', async () => {
    const client = ClientFaker.legal({
      taxId: { type: 'cnpj', value: '12345678000100' },
    })
    clientsRepository.findByTaxId.mockResolvedValue(undefined)
    clientsRepository.add.mockResolvedValue(client)
    const useCase = new RegisterClientUseCase(
      clientsRepository,
      clientConsentsRepository,
      datetimeProvider,
    )

    await expect(
      useCase.execute({
        type: 'legal',
        legalName: 'Metalúrgica SJC Ltda.',
        tradeName: 'Metalúrgica SJC',
        taxId: '12.345.678/0001-00',
      }),
    ).resolves.toEqual({ client, consents: [] })
    expect(clientConsentsRepository.addMany).not.toHaveBeenCalled()
  })
})
