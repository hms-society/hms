import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ClientFaker } from '../../domain/entities/fakers'
import type { ClientConsentsRepository, ClientsRepository } from '../../interfaces'
import { LookupClientUseCase } from '../lookup-client-use-case'

describe('Lookup Client Use Case', () => {
  let clientsRepository: MockProxy<ClientsRepository>
  let clientConsentsRepository: MockProxy<ClientConsentsRepository>

  beforeEach(() => {
    clientsRepository = mock<ClientsRepository>()
    clientConsentsRepository = mock<ClientConsentsRepository>()
  })

  it('returns a client found by CPF', async () => {
    const client = ClientFaker.fake({
      taxId: { type: 'cpf', value: '12345678900' },
    })
    clientsRepository.findByTaxId.mockResolvedValue(client)
    clientConsentsRepository.findByClientId.mockResolvedValue([])
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ taxId: '123.456.789-00' })).resolves.toEqual({
      client,
      consents: [],
    })
  })

  it('returns a unique client found by phone', async () => {
    const client = ClientFaker.fake({ phone: '5511999999999' })
    clientsRepository.findByPhone.mockResolvedValue([client])
    clientConsentsRepository.findByClientId.mockResolvedValue([])
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ phone: '(11) 99999-9999' })).resolves.toEqual({
      client,
      consents: [],
    })
  })

  it('fails when no client is found', async () => {
    clientsRepository.findByTaxId.mockResolvedValue(undefined)
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ taxId: '12345678900' })).rejects.toThrow(
      'Cliente não encontrado.',
    )
  })

  it('fails when the search criteria are invalid', async () => {
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({})).rejects.toThrow(
      'Informe CPF, CNPJ ou telefone para realizar a busca.',
    )
  })
})
