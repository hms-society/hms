import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ClientFaker } from '../../domain/entities/fakers'
import type { ClientConsentsRepository, ClientsRepository } from '../../interfaces'
import { LookupClientUseCase } from '../lookup-client-use-case'

const cpf = '52998224725'
const cnpj = '11222333000181'

describe('LookupClientUseCase', () => {
  let clientsRepository: MockProxy<ClientsRepository>
  let clientConsentsRepository: MockProxy<ClientConsentsRepository>

  beforeEach(() => {
    clientsRepository = mock<ClientsRepository>()
    clientConsentsRepository = mock<ClientConsentsRepository>()
    clientConsentsRepository.findByClientId.mockResolvedValue([])
  })

  it('normalizes a valid CPF before lookup', async () => {
    const client = ClientFaker.fake({ taxId: { type: 'cpf', value: cpf } })
    clientsRepository.findByTaxId.mockResolvedValue(client)
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ taxId: '529.982.247-25' })).resolves.toEqual({
      client,
      consents: [],
    })
    expect(clientsRepository.findByTaxId).toHaveBeenCalledWith({
      type: 'cpf',
      value: cpf,
    })
  })

  it('normalizes a valid CNPJ before lookup', async () => {
    const client = ClientFaker.legal({ taxId: { type: 'cnpj', value: cnpj } })
    clientsRepository.findByTaxId.mockResolvedValue(client)
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ taxId: '11.222.333/0001-81' })).resolves.toMatchObject(
      {
        client,
      },
    )
  })

  it('prioritizes tax ID when phone is also provided', async () => {
    const client = ClientFaker.fake({ taxId: { type: 'cpf', value: cpf } })
    clientsRepository.findByTaxId.mockResolvedValue(client)
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await useCase.execute({ taxId: cpf, phone: '(11) 99999-9999' })

    expect(clientsRepository.findByTaxId).toHaveBeenCalled()
    expect(clientsRepository.findByPhone).not.toHaveBeenCalled()
  })

  it('returns a unique client found by phone', async () => {
    const client = ClientFaker.fake({ phone: '5511999999999' })
    clientsRepository.findByPhone.mockResolvedValue([client])
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ phone: '(11) 99999-9999' })).resolves.toMatchObject({
      client,
    })
    expect(clientsRepository.findByPhone).toHaveBeenCalledWith('11999999999')
  })

  it('rejects an ambiguous phone match', async () => {
    clientsRepository.findByPhone.mockResolvedValue([
      ClientFaker.fake(),
      ClientFaker.fake(),
    ])
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ phone: '11999999999' })).rejects.toThrow()
  })

  it.each([
    '529.982.247-26',
    '111.111.111-11',
    '123',
  ])('rejects invalid tax ID %s before repository access', async (taxId) => {
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ taxId })).rejects.toThrow('CPF ou CNPJ inválido')
    expect(clientsRepository.findByTaxId).not.toHaveBeenCalled()
  })

  it('rejects empty criteria', async () => {
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({})).rejects.toThrow('Informe CPF, CNPJ ou telefone')
  })

  it('returns not found when no client matches', async () => {
    clientsRepository.findByTaxId.mockResolvedValue(undefined)
    const useCase = new LookupClientUseCase(clientsRepository, clientConsentsRepository)

    await expect(useCase.execute({ taxId: cpf })).rejects.toThrow(
      'Cliente não encontrado',
    )
  })
})
