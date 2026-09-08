import { AppError } from '#shared/domain/errors'
import type { LegalCase } from '../domain/entities'
import { CaseMemberRole, LegalCaseStatus } from '../domain/structures'
import type { CaseMembersRepository, LegalCasesRepository } from '../interfaces'
import type { IntakesRepository } from '../../intake/interfaces'

export type CreateLegalCaseUseCaseParams = {
  title: string
  intakeId: string
  legalAreaId: string
  legalTopicId: string
  description?: string
  team: Array<{
    collaboratorId: string
    role: string
    permission: string
  }>
  actorId: string
}

export class CreateLegalCaseUseCase {
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly intakesRepository: IntakesRepository,
  ) {}

  async execute(params: CreateLegalCaseUseCaseParams): Promise<LegalCase> {
    const { title, intakeId, legalAreaId, legalTopicId, description, team, actorId } = params

    if (!title || !intakeId || !legalAreaId || !legalTopicId) {
      throw new AppError('Parâmetros obrigatórios ausentes para criação de caso', 'Requisição Inválida')
    }

    const intake = await this.intakesRepository.findById(intakeId)
    if (!intake) {
      throw new AppError('Triagem informada não existe', 'Não Encontrado')
    }

    const openedAt = new Date()

    let legalCase: LegalCase
    try {
      legalCase = await this.legalCasesRepository.createCaseWithTeam({
        legalCase: {
          title,
          clientId: intake.clientId,
          intakeId,
          legalAreaId,
          legalTopicId,
          description,
          status: LegalCaseStatus.Documentation,
          openedAt,
        },
        team: [
          {
            collaboratorId: actorId,
            role: CaseMemberRole.LeadLawyer,
            permission: 'execução',
            isPrimary: true,
            assignedAt: openedAt,
            assignedBy: actorId,
          },
          ...team.map((member) => ({
            collaboratorId: member.collaboratorId,
            role: member.role as CaseMemberRole,
            permission: member.permission,
            isPrimary: false,
            assignedAt: openedAt,
            assignedBy: actorId,
          }))
        ],
      })
    } catch (error: any) {
      const errorMsg = [
        error.message, 
        error.cause?.message, 
        error.cause?.constraint_name, 
        error.constraint_name
      ].join(' ');

      if (errorMsg.includes('cases_intake_id_uidx')) {
        throw new AppError('Esta triagem (Intake) já foi utilizada em outro caso jurídico.', 'Conflito de Triagem')
      }
      if (errorMsg.includes('case_members_case_collaborator_uidx')) {
        throw new AppError('Um mesmo colaborador não pode ser adicionado mais de uma vez à equipe do caso.', 'Conflito de Equipe')
      }
      if (errorMsg.includes('cases_public_code_uidx')) {
        throw new AppError('Houve um conflito na geração do código do caso. Tente novamente.', 'Conflito de Código')
      }

      throw error
    }

    return legalCase
  }
}
