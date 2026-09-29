import type { UseCase } from '#shared/interfaces'

import type { ThirdParty } from '../domain/entities'
import {
  InvalidThirdPartyDataError,
  ThirdPartyAlreadyExistsError,
  ThirdPartyResponsibleNotFoundError,
} from '../domain/errors'
import {
  TaxIdType,
  UserStatus,
  type TaxId,
  type ThirdPartyRelationshipType,
  type ThirdPartyType,
} from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { ThirdPartiesRepository } from '../interfaces/third-parties-repository'
import type { ThirdPartyAuditLogsRepository } from '../interfaces/third-party-audit-logs-repository'
import type { UsersRepository } from '../interfaces/users-repository'

export type RegisterThirdPartyRequest = {
  readonly actorId: string
  readonly actorProfile: 'admin' | 'supervisor'
  readonly type: ThirdPartyType
  readonly legalName: string
  readonly tradeName?: string
  readonly taxId: string
  readonly taxIdType: Exclude<TaxId['type'], 'cpf'>
  readonly taxIdDescription?: string
  readonly internalResponsibleId: string
  readonly relationshipTypes: readonly ThirdPartyRelationshipType[]
}

export class RegisterThirdPartyUseCase
  implements UseCase<RegisterThirdPartyRequest, ThirdParty>
{
  constructor(
    private readonly thirdPartiesRepository: ThirdPartiesRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsRepository?: ThirdPartyAuditLogsRepository,
  ) {}

  async execute(request: RegisterThirdPartyRequest): Promise<ThirdParty> {
    this.validateRequest(request)
    const taxId = this.parseTaxId(request)

    const responsible = await this.collaboratorsRepository.findById(
      request.internalResponsibleId,
    )
    if (!responsible) throw new ThirdPartyResponsibleNotFoundError()

    const responsibleUser = await this.usersRepository.findById(responsible.userId)
    if (!responsibleUser || responsibleUser.status !== UserStatus.Active) {
      throw new InvalidThirdPartyDataError(
        'O responsável interno deve ser um colaborador ativo.',
      )
    }

    if (responsible.profile === 'client') {
      throw new InvalidThirdPartyDataError(
        'O responsável interno deve ser um colaborador da HMS.',
      )
    }

    const existingThirdParty = await this.thirdPartiesRepository.findByTaxId(taxId)
    if (existingThirdParty) throw new ThirdPartyAlreadyExistsError()

    const thirdParty = await this.thirdPartiesRepository.add({
      type: request.type,
      legalName: request.legalName.trim(),
      tradeName: request.tradeName?.trim() || undefined,
      taxId,
      internalResponsibleId: request.internalResponsibleId,
      relationshipTypes: [...new Set(request.relationshipTypes)],
    })

    if (!thirdParty) throw new ThirdPartyAlreadyExistsError()

    await this.auditLogsRepository?.create({
      actorId: request.actorId,
      actorProfile: request.actorProfile,
      action: 'created',
      thirdParty,
    })

    return thirdParty
  }

  private validateRequest(request: RegisterThirdPartyRequest) {
    if (!request.actorId?.trim()) {
      throw new InvalidThirdPartyDataError('Autor do cadastro é obrigatório.')
    }

    if (!['admin', 'supervisor'].includes(request.actorProfile)) {
      throw new InvalidThirdPartyDataError(
        'Somente administradores e supervisores podem cadastrar terceiros.',
      )
    }

    if (!request.legalName?.trim()) {
      throw new InvalidThirdPartyDataError('Nome ou razão social é obrigatório.')
    }

    if (!request.internalResponsibleId?.trim()) {
      throw new InvalidThirdPartyDataError('Responsável interno é obrigatório.')
    }

    if (!request.taxId?.trim()) {
      throw new InvalidThirdPartyDataError('Documento nacional é obrigatório.')
    }

    if (!Object.values(TaxIdType).includes(request.taxIdType)) {
      throw new InvalidThirdPartyDataError('Tipo de documento nacional inválido.')
    }

    if (!request.relationshipTypes?.length) {
      throw new InvalidThirdPartyDataError('Informe ao menos uma natureza do vínculo.')
    }
  }

  private parseTaxId(
    request: RegisterThirdPartyRequest,
  ): TaxId<'cnpj' | 'official_registration' | 'other_national_document'> {
    const normalizedValue = this.normalizeDocument(request.taxId, request.taxIdType)

    if ((request.taxIdType as TaxId['type']) === TaxIdType.Cpf) {
      throw new InvalidThirdPartyDataError('CPF não é aceito como documento de terceiro.')
    }

    if (request.taxIdType === TaxIdType.Cnpj && !this.isValidCnpj(normalizedValue)) {
      throw new InvalidThirdPartyDataError('CNPJ inválido.')
    }

    return {
      type: request.taxIdType,
      value: normalizedValue,
      description: request.taxIdDescription?.trim() || undefined,
    }
  }

  private normalizeDocument(value: string, type: TaxId['type']) {
    if (type === TaxIdType.Cpf || type === TaxIdType.Cnpj) {
      return value.replace(/\D/g, '')
    }

    return value
      .trim()
      .toUpperCase()
      .replace(/[\s./-]/g, '')
  }

  private isValidCnpj(value: string) {
    if (value.length !== 14 || /^([0-9])\1+$/.test(value)) return false

    const calculateDigit = (length: number) => {
      const weights =
        length === 12
          ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
          : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      const total = value
        .slice(0, length)
        .split('')
        .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0)
      const remainder = total % 11
      return remainder < 2 ? 0 : 11 - remainder
    }

    return (
      calculateDigit(12) === Number(value[12]) && calculateDigit(13) === Number(value[13])
    )
  }
}
