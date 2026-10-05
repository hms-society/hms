import type { UseCase } from '#shared/interfaces/use-case'

import type { ThirdParty } from '../domain/entities'
import { InvalidThirdPartyDataError, ThirdPartyNotFoundError } from '../domain/errors'
import { TaxIdType, UserStatus, type TaxId } from '../domain/structures'
import type { CollaboratorsRepository } from '../interfaces/collaborators-repository'
import type { ThirdPartiesRepository } from '../interfaces/third-parties-repository'
import type { ThirdPartyAuditLogsRepository } from '../interfaces/third-party-audit-logs-repository'
import type { UsersRepository } from '../interfaces/users-repository'

type ThirdPartyTaxId = TaxId<'cnpj' | 'official_registration' | 'other_national_document'>

export type UpdateThirdPartyRequest = {
  readonly actorId: string
  readonly actorProfile: 'admin' | 'supervisor'
  readonly thirdPartyId: string
  readonly type?: ThirdParty['type']
  readonly legalName?: string
  readonly tradeName?: string
  readonly taxId?: string
  readonly taxIdType?: ThirdPartyTaxId['type']
  readonly taxIdDescription?: string
  readonly internalResponsibleId?: string
  readonly relationshipTypes?: ThirdParty['relationshipTypes']
}

export class UpdateThirdPartyUseCase
  implements UseCase<UpdateThirdPartyRequest, ThirdParty>
{
  constructor(
    private readonly thirdPartiesRepository: ThirdPartiesRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsRepository?: ThirdPartyAuditLogsRepository,
  ) {}

  async execute(request: UpdateThirdPartyRequest): Promise<ThirdParty> {
    if (!['admin', 'supervisor'].includes(request.actorProfile)) {
      throw new InvalidThirdPartyDataError(
        'Somente administradores e supervisores podem editar terceiros.',
      )
    }

    const current = await this.thirdPartiesRepository.findById(request.thirdPartyId)
    if (!current) throw new ThirdPartyNotFoundError()

    const responsibleId = request.internalResponsibleId ?? current.internalResponsibleId
    const responsible = await this.collaboratorsRepository.findById(responsibleId)
    if (!responsible)
      throw new InvalidThirdPartyDataError('Responsável interno inválido.')
    const responsibleUser = await this.usersRepository.findById(responsible.userId)
    if (!responsibleUser || responsibleUser.status !== UserStatus.Active) {
      throw new InvalidThirdPartyDataError('O responsável interno deve ser ativo.')
    }
    if (responsible.profile === 'client') {
      throw new InvalidThirdPartyDataError('O responsável deve ser colaborador da HMS.')
    }

    const taxIdType = request.taxIdType ?? current.taxId.type
    const taxIdValue = request.taxId?.trim() ?? current.taxId.value
    const taxId = this.parseTaxId(
      taxIdValue,
      taxIdType,
      request.taxIdDescription ?? current.taxId.description,
    )
    const existing = await this.thirdPartiesRepository.findByTaxId(taxId)
    if (existing && existing.id !== current.id) {
      throw new InvalidThirdPartyDataError(
        'Este documento já está cadastrado para outro terceiro.',
      )
    }

    const updated = await this.thirdPartiesRepository.update(current.id, {
      type: request.type ?? current.type,
      legalName: request.legalName?.trim() || current.legalName,
      tradeName:
        request.tradeName !== undefined
          ? request.tradeName.trim() || undefined
          : current.tradeName,
      taxId,
      internalResponsibleId: responsibleId,
      relationshipTypes: request.relationshipTypes?.length
        ? [...new Set(request.relationshipTypes)]
        : current.relationshipTypes,
    })
    if (!updated) throw new ThirdPartyNotFoundError()

    await this.auditLogsRepository?.create({
      actorId: request.actorId,
      actorProfile: request.actorProfile,
      action: 'updated',
      thirdParty: updated,
    })
    return updated
  }

  private parseTaxId(
    value: string,
    type: ThirdPartyTaxId['type'],
    description?: string,
  ): ThirdPartyTaxId {
    if (!Object.values(TaxIdType).includes(type)) {
      throw new InvalidThirdPartyDataError('Tipo de documento nacional inválido.')
    }
    const normalizedValue =
      type === TaxIdType.Cnpj ? value.replace(/\D/g, '') : value.trim()
    if (!normalizedValue)
      throw new InvalidThirdPartyDataError('Documento nacional é obrigatório.')
    if (type === TaxIdType.Cnpj && normalizedValue.length !== 14) {
      throw new InvalidThirdPartyDataError('CNPJ inválido.')
    }
    return { type, value: normalizedValue, description: description?.trim() || undefined }
  }
}
