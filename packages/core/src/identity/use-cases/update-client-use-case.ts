import type { Client, ClientUpdate } from '../domain/entities'
import {
  CollaboratorNotAuthorizedError,
  InvalidClientDataError,
  ClientDocumentDuplicatedError,
} from '../domain/errors'
import type { AuthUser } from '../domain/structures'
import type { ClientsRepository, CollaboratorsRepository, UsersRepository } from '../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'

type Request = {
  readonly authUser: AuthUser
  readonly clientId: string
  readonly changes: ClientUpdate
  readonly duplicityOverrideJustification?: string
}

const ATTENDANT_PROFILES = new Set(['attendant'])
const SUPERVISOR_PROFILES = new Set(['admin', 'supervisor'])

export class UpdateClientUseCase implements UseCase<Request, Client> {
  constructor(
    private readonly clientsRepository: ClientsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly collaboratorsRepository: CollaboratorsRepository,
  ) {}

  async execute({ authUser, clientId, changes, duplicityOverrideJustification }: Request): Promise<Client> {
    const user = await this.usersRepository.findById(authUser.id)
    if (!user || user.status !== 'active') throw new CollaboratorNotAuthorizedError()
    
    const collaborator = await this.collaboratorsRepository.findByUserId(user.id)
    if (!collaborator) throw new CollaboratorNotAuthorizedError()

    const client = await this.clientsRepository.findById(clientId)
    if (!client) throw new InvalidClientDataError('Cliente não encontrado.')

    const isAttendant = ATTENDANT_PROFILES.has(collaborator.profile)
    const isSupervisorOrAdmin = SUPERVISOR_PROFILES.has(collaborator.profile)
    if (isAttendant) {
      const isNameChanged = changes.type === 'natural' && (changes as any).name !== undefined && (changes as any).name !== (client as any).name
      const isLegalNameChanged = changes.type === 'legal' && (changes as any).legalName !== undefined && (changes as any).legalName !== (client as any).legalName
      const isTradeNameChanged = changes.type === 'legal' && (changes as any).tradeName !== undefined && (changes as any).tradeName !== (client as any).tradeName
      const isTaxIdChanged = changes.taxId !== undefined && changes.taxId.value !== client.taxId.value

      if (isNameChanged || isLegalNameChanged || isTradeNameChanged || isTaxIdChanged) {
        throw new CollaboratorNotAuthorizedError('Perfil de Atendimento não tem permissão para alterar CPF/CNPJ ou Nome/Razão Social.')
      }
    }

    if (changes.taxId && changes.taxId.value !== client.taxId.value) {
      const normalizedTaxId = changes.taxId.value.replace(/\D/g, '')
      ;(changes as any).taxId = { ...changes.taxId, value: normalizedTaxId } // Normalize to save in DB 
      const existingClient = await this.clientsRepository.findByTaxId({ ...changes.taxId, value: normalizedTaxId })
      
      if (existingClient && existingClient.id !== client.id) {
        if (!isSupervisorOrAdmin || !duplicityOverrideJustification) {
          throw new ClientDocumentDuplicatedError()
        }
      }
    }
    const auditLogs = this.generateAuditLogs(client, changes, user.id, collaborator.profile)
    
    if (duplicityOverrideJustification) {
      auditLogs.push({
        idUsuario: user.id,
        perfilUsuario: collaborator.profile,
        entidade: 'Pessoa',
        idEntidade: client.id,
        campoAlterado: 'justificativa_duplicidade',
        valorAnterior: null,
        valorNovo: duplicityOverrideJustification,
      })
    }

    if (auditLogs.length === 0) return client

    const updatedClient = await this.clientsRepository.replace(clientId, changes, auditLogs)
    if (!updatedClient) throw new InvalidClientDataError('Falha ao atualizar o cliente.')

    return updatedClient
  }

  private generateAuditLogs(oldClient: Client, newChanges: ClientUpdate, userId: string, profile: string): any[] {
    const logs: any[] = []
    
    // Normaliza null, undefined e strings vazias para um padrão comum (null) a fim de evitar falsos positivos
    const normalize = (val: any) => (val === null || val === undefined || val === '') ? null : val

    const log = (campo: string, oldVal: any, newVal: any) => {
      if (newVal !== undefined && normalize(oldVal) !== normalize(newVal)) {
        logs.push({
          idUsuario: userId,
          perfilUsuario: profile,
          entidade: 'Pessoa',
          idEntidade: oldClient.id,
          campoAlterado: campo,
          valorAnterior: oldVal ? String(oldVal) : null,
          valorNovo: newVal ? String(newVal) : null,
        })
      }
    }

    if (oldClient.type === 'natural' && newChanges.type === 'natural') {
      log('nome_completo', oldClient.name, newChanges.name)
    } else if (oldClient.type === 'legal' && newChanges.type === 'legal') {
      log('razao_social', oldClient.legalName, newChanges.legalName)
      log('nome_fantasia', oldClient.tradeName, newChanges.tradeName)
    }

    log('tax_id', oldClient.taxId.value, newChanges.taxId?.value)
    log('email', oldClient.email, newChanges.email)
    log('telefone', oldClient.phone, newChanges.phone)
    log('cep', oldClient.address?.zipCode, newChanges.address?.zipCode)
    log('logradouro', oldClient.address?.street, newChanges.address?.street)
    log('numero', oldClient.address?.number, newChanges.address?.number)
    log('complemento', oldClient.address?.complement, newChanges.address?.complement)
    log('bairro', oldClient.address?.district, newChanges.address?.district)
    log('cidade', oldClient.address?.city, newChanges.address?.city)
    log('uf', oldClient.address?.state, newChanges.address?.state)

    return logs
  }
}
