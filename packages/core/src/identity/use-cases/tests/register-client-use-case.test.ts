import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { ClientFaker } from '../../domain/entities/fakers'
import type { ClientsRepository } from '../../interfaces'
import { RegisterClientUseCase } from '../register-client-use-case'

const cpf = '52998224725'
const cnpj = '11222333000181'

describe('RegisterClientUseCase', () => {
  let clientsRepository: MockProxy<ClientsRepository>

  beforeEach(() => {
    clientsRepository = mock<ClientsRepository>()
  })

  it('registers a normalized natural client without consents', async () => {
    const client = ClientFaker.fake({ taxId: { type: 'cpf', value: cpf } })
    clientsRepository.findByTaxId.mockResolvedValue(undefined)
    clientsRepository.add.mockResolvedValue(client)
    const useCase = new RegisterClientUseCase(clientsRepository)

    await expect(
      useCase.execute({
        type: 'natural',
        name: '  Ricardo Alves de Souza  ',
        taxId: '529.982.247-25',
        phone: '(12) 99876-3322',
        email: ' ricardo@example.com ',
      }),
    ).resolves.toEqual({ client, consents: [] })

    expect(clientsRepository.add).toHaveBeenCalledWith({
      type: 'natural',
      name: 'Ricardo Alves de Souza',
      taxId: { type: 'cpf', value: cpf },
      phone: '12998763322',
      email: 'ricardo@example.com',
      address: undefined,
    })
  })

  it('registers a normalized legal client', async () => {
    const client = ClientFaker.legal({ taxId: { type: 'cnpj', value: cnpj } })
    clientsRepository.findByTaxId.mockResolvedValue(undefined)
    clientsRepository.add.mockResolvedValue(client)
    const useCase = new RegisterClientUseCase(clientsRepository)

    await expect(
      useCase.execute({
        type: 'legal',
        legalName: ' Metalúrgica SJC Ltda. ',
        tradeName: ' Metalúrgica SJC ',
        taxId: '11.222.333/0001-81',
      }),
    ).resolves.toEqual({ client, consents: [] })

    expect(clientsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'legal',
        legalName: 'Metalúrgica SJC Ltda.',
        tradeName: 'Metalúrgica SJC',
        taxId: { type: 'cnpj', value: cnpj },
      }),
    )
  })

  it.each([
    ['an invalid CPF', { type: 'natural' as const, name: 'Maria', taxId: '529.982.247-26' }],
    ['a repeated CPF', { type: 'natural' as const, name: 'Maria', taxId: '111.111.111-11' }],
    ['a CPF with the legal type', { type: 'legal' as const, legalName: 'Empresa', taxId: cpf }],
    ['a missing natural name', { type: 'natural' as const, taxId: cpf }],
    ['a missing legal name', { type: 'legal' as const, taxId: cnpj }],
    ['an incompatible legal name', { type: 'natural' as const, name: 'Maria', legalName: 'Empresa', taxId: cpf }],
  ])('rejects %s before persistence', async (_, request) => {
    const useCase = new RegisterClientUseCase(clientsRepository)

    await expect(useCase.execute(request)).rejects.toThrow()
    expect(clientsRepository.findByTaxId).not.toHaveBeenCalled()
    expect(clientsRepository.add).not.toHaveBeenCalled()
  })

  it('rejects a pre-existing client', async () => {
    clientsRepository.findByTaxId.mockResolvedValue(ClientFaker.fake())
    const useCase = new RegisterClientUseCase(clientsRepository)

    await expect(
      useCase.execute({ type: 'natural', name: 'Maria', taxId: cpf }),
    ).rejects.toThrow('Já existe um cliente cadastrado')
    expect(clientsRepository.add).not.toHaveBeenCalled()
  })

  it('maps a concurrent repository collision to a conflict', async () => {
    clientsRepository.findByTaxId.mockResolvedValue(undefined)
    clientsRepository.add.mockResolvedValue(undefined)
    const useCase = new RegisterClientUseCase(clientsRepository)

    await expect(
      useCase.execute({ type: 'natural', name: 'Maria', taxId: cpf }),
    ).rejects.toThrow('Já existe um cliente cadastrado')
  })
})
