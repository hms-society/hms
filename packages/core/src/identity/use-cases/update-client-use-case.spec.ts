import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UpdateClientUseCase } from './update-client-use-case'
import { ClientsRepository, UsersRepository, CollaboratorsRepository } from '../interfaces'
import { Client, Collaborator } from '../domain/entities'
import { CollaboratorNotAuthorizedError, ClientDocumentDuplicatedError } from '../domain/errors'

describe('UpdateClientUseCase', () => {
  let useCase: UpdateClientUseCase
  let clientsRepositoryMock: vi.Mocked<ClientsRepository>
  let usersRepositoryMock: vi.Mocked<UsersRepository>
  let collaboratorsRepositoryMock: vi.Mocked<CollaboratorsRepository>

  const mockClient: Client = {
    id: 'client-123',
    type: 'natural',
    name: 'João da Silva',
    taxId: { type: 'cpf', value: '11122233344' },
    email: 'joao@email.com',
  } as Client

  const mockAttendant: Collaborator = {
    id: 'collab-1',
    profile: 'attendant',
  } as Collaborator

  const mockSupervisor: Collaborator = {
    id: 'collab-2',
    profile: 'supervisor',
  } as Collaborator

  beforeEach(() => {
    clientsRepositoryMock = {
      findById: vi.fn().mockResolvedValue(mockClient),
      findByTaxId: vi.fn().mockResolvedValue(undefined),
      replace: vi.fn().mockResolvedValue(mockClient),
    } as unknown as vi.Mocked<ClientsRepository>

    usersRepositoryMock = {
      findById: vi.fn().mockResolvedValue({ id: 'user-1', status: 'active' }),
    } as unknown as vi.Mocked<UsersRepository>

    collaboratorsRepositoryMock = {
      findByUserId: vi.fn().mockImplementation(async () => mockAttendant),
    } as unknown as vi.Mocked<CollaboratorsRepository>

    useCase = new UpdateClientUseCase(
      clientsRepositoryMock,
      usersRepositoryMock,
      collaboratorsRepositoryMock
    )
  })

  it('deve bloquear Atendente tentando alterar CPF ou Nome', async () => {
    const changes = { type: 'natural', name: 'João Alterado', taxId: { type: 'cpf', value: '99999999999' } }

    await expect(
      useCase.execute({
        authUser: { id: 'user-1', email: 'test@test.com' },
        clientId: 'client-123',
        changes: changes as any,
      })
    ).rejects.toThrow(CollaboratorNotAuthorizedError)
  })

  it('deve permitir Atendente alterar E-mail e Endereço', async () => {
    const changes = { type: 'natural', email: 'novo@email.com', address: { city: 'São Paulo' } }
    
    clientsRepositoryMock.replace.mockResolvedValueOnce({ ...mockClient, ...changes } as Client)

    const result = await useCase.execute({
      authUser: { id: 'user-1', email: 'test@test.com' },
      clientId: 'client-123',
      changes: changes as any,
    })

    expect(result.email).toBe('novo@email.com')
    expect(clientsRepositoryMock.replace).toHaveBeenCalledWith(
      'client-123',
      expect.any(Object),
      expect.arrayContaining([
        expect.objectContaining({ campoAlterado: 'email', valorNovo: 'novo@email.com' })
      ])
    )
  })

  it('deve disparar erro 409 se CPF já existir em outro cliente', async () => {
    collaboratorsRepositoryMock.findByUserId.mockResolvedValueOnce(mockSupervisor)
    clientsRepositoryMock.findByTaxId.mockResolvedValueOnce({ id: 'outro-cliente' } as Client)

    const changes = { type: 'natural', taxId: { type: 'cpf', value: '12345678900' } }

    await expect(
      useCase.execute({
        authUser: { id: 'user-1', email: 'test@test.com' },
        clientId: 'client-123',
        changes: changes as any,
      })
    ).rejects.toThrow(ClientDocumentDuplicatedError)
  })

  it('deve forçar salvamento de duplicidade caso tenha Perfil Autorizado e Justificativa', async () => {
    collaboratorsRepositoryMock.findByUserId.mockResolvedValueOnce(mockSupervisor)
    clientsRepositoryMock.findByTaxId.mockResolvedValueOnce({ id: 'outro-cliente' } as Client)
    
    const changes = { type: 'natural', taxId: { type: 'cpf', value: '12345678900' } }

    await useCase.execute({
      authUser: { id: 'user-1', email: 'test@test.com' },
      clientId: 'client-123',
      changes: changes as any,
      duplicityOverrideJustification: 'Cliente antigo exige recadastro',
    })

    expect(clientsRepositoryMock.replace).toHaveBeenCalledWith(
      'client-123',
      expect.any(Object),
      expect.arrayContaining([
        expect.objectContaining({
          campoAlterado: 'justificativa_duplicidade',
          valorNovo: 'Cliente antigo exige recadastro'
        })
      ])
    )
  })
})
