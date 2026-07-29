import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ClientFaker } from '../../domain/entities/fakers'
import type { ClientConsentsRepository, ClientsRepository } from '../../interfaces'
import { GetClientUseCase } from '../get-client-use-case'

describe('Get Client Use Case', () => {
  let clientsRepository: MockProxy<ClientsRepository>
  let clientConsentsRepository: MockProxy<ClientConsentsRepository>

  beforeEach(() => {
    clientsRepository = mock<ClientsRepository>()
    clientConsentsRepository = mock<ClientConsentsRepository>()
  })

  it('returns a client with its active consents by id', async () => {
    const client = ClientFaker.fake()
    const consents = [
      {
        id: 'consent-id',
        clientId: client.id,
        type: 'data_processing' as const,
        grantedAt: new Date(),
      },
    ]
    clientsRepository.findById.mockResolvedValue(client)
    clientConsentsRepository.findByClientId.mockResolvedValue(consents)
    const useCase = new GetClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ clientId: client.id })).resolves.toEqual({
      client,
      consents,
    })
  })

  it('fails when the client does not exist', async () => {
    clientsRepository.findById.mockResolvedValue(undefined)
    const useCase = new GetClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ clientId: 'missing' })).rejects.toThrow(
      'Cliente não encontrado.',
    )
  })
})
