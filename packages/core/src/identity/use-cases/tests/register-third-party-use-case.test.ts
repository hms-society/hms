import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  CollaboratorFaker,
  ThirdPartyFaker,
  UserFaker,
} from '../../domain/entities/fakers'
import type { CollaboratorsRepository } from '../../interfaces/collaborators-repository'
import type { ThirdPartiesRepository } from '../../interfaces/third-parties-repository'
import type { UsersRepository } from '../../interfaces/users-repository'
import {
  RegisterThirdPartyUseCase,
  type RegisterThirdPartyRequest,
} from '../register-third-party-use-case'

const cnpj = '11222333000181'

describe('RegisterThirdPartyUseCase', () => {
  let thirdPartiesRepository: MockProxy<ThirdPartiesRepository>
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let usersRepository: MockProxy<UsersRepository>
  let useCase: RegisterThirdPartyUseCase
  const collaborator = CollaboratorFaker.administrative({
    id: 'collaborator-1',
    userId: 'user-1',
  })
  const user = UserFaker.fake({ id: 'user-1', status: 'active' })

  beforeEach(() => {
    thirdPartiesRepository = mock<ThirdPartiesRepository>()
    collaboratorsRepository = mock<CollaboratorsRepository>()
    usersRepository = mock<UsersRepository>()
    collaboratorsRepository.findById.mockResolvedValue(collaborator)
    usersRepository.findById.mockResolvedValue(user)
    thirdPartiesRepository.findByTaxId.mockResolvedValue(undefined)
    useCase = new RegisterThirdPartyUseCase(
      thirdPartiesRepository,
      collaboratorsRepository,
      usersRepository,
    )
  })

  it('registers a third party with a normalized CNPJ', async () => {
    const thirdParty = ThirdPartyFaker.fake({
      taxId: { type: 'cnpj', value: cnpj, description: 'Cadastro nacional' },
    })
    thirdPartiesRepository.add.mockResolvedValue(thirdParty)

    await expect(
      useCase.execute({
        actorProfile: 'admin',
        type: 'union',
        legalName: '  Sindicato HMS  ',
        tradeName: '  Sindicato HMS  ',
        taxId: '11.222.333/0001-81',
        taxIdType: 'cnpj',
        taxIdDescription: '  Cadastro nacional  ',
        internalResponsibleId: collaborator.id,
        relationshipTypes: ['demand_origin', 'demand_origin', 'payer'],
      }),
    ).resolves.toBe(thirdParty)

    expect(thirdPartiesRepository.add).toHaveBeenCalledWith({
      type: 'union',
      legalName: 'Sindicato HMS',
      tradeName: 'Sindicato HMS',
      taxId: { type: 'cnpj', value: cnpj, description: 'Cadastro nacional' },
      internalResponsibleId: collaborator.id,
      relationshipTypes: ['demand_origin', 'payer'],
    })
  })

  it('accepts an official national registration', async () => {
    const thirdParty = ThirdPartyFaker.fake({
      taxId: { type: 'official_registration', value: 'REGISTRO123' },
    })
    thirdPartiesRepository.add.mockResolvedValue(thirdParty)

    await expect(
      useCase.execute({
        ...validRequest(),
        actorProfile: 'supervisor',
        type: 'association',
        taxId: ' registro-123 ',
        taxIdType: 'official_registration',
      }),
    ).resolves.toBe(thirdParty)
  })

  it.each([
    ['an unauthorized actor', { actorProfile: 'lawyer' }],
    ['a missing name', { legalName: ' ' }],
    ['a missing responsible', { internalResponsibleId: ' ' }],
    ['no relationship', { relationshipTypes: [] }],
    ['a CPF document', { taxId: '52998224725', taxIdType: 'cpf' }],
    ['an invalid CNPJ', { taxId: '11222333000180', taxIdType: 'cnpj' }],
  ])('rejects %s before persistence', async (_, changes) => {
    const request = {
      ...validRequest(),
      ...changes,
    } as unknown as RegisterThirdPartyRequest

    await expect(useCase.execute(request)).rejects.toThrow()
    expect(thirdPartiesRepository.findByTaxId).not.toHaveBeenCalled()
    expect(thirdPartiesRepository.add).not.toHaveBeenCalled()
  })

  it('rejects an inactive responsible user', async () => {
    usersRepository.findById.mockResolvedValue(UserFaker.fake({ status: 'disabled' }))

    await expect(useCase.execute(validRequest())).rejects.toThrow(
      'responsável interno deve ser um colaborador ativo',
    )
    expect(thirdPartiesRepository.add).not.toHaveBeenCalled()
  })

  it('rejects a missing responsible collaborator', async () => {
    collaboratorsRepository.findById.mockResolvedValue(undefined)

    await expect(useCase.execute(validRequest())).rejects.toThrow(
      'responsável interno informado não foi encontrado',
    )
  })

  it('rejects a duplicated document', async () => {
    thirdPartiesRepository.findByTaxId.mockResolvedValue(ThirdPartyFaker.fake())

    await expect(useCase.execute(validRequest())).rejects.toThrow(
      'Já existe um terceiro cadastrado',
    )
    expect(thirdPartiesRepository.add).not.toHaveBeenCalled()
  })
})

function validRequest(): RegisterThirdPartyRequest {
  return {
    actorProfile: 'admin',
    type: 'union',
    legalName: 'Sindicato HMS',
    taxId: cnpj,
    taxIdType: 'cnpj',
    internalResponsibleId: collaboratorId,
    relationshipTypes: ['demand_origin'],
  }
}

const collaboratorId = 'collaborator-1'
