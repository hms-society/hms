import { Inject, Injectable } from '@nestjs/common'
import type {
  CaseMemberCreation,
  LegalCase,
  LegalCaseCreation,
} from '@hms/core/case-management/domain/entities'
import {
  CaseMemberRole,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'
import type {
  CaseMembersRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type { Intake } from '@hms/core/intake/domain/entities'
import { AppError } from '@hms/core/shared/domain/errors'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

export type CaseManagementSeedReferences = {
  contractedIntakes: readonly Intake[]
  lawyerIds: readonly string[]
  paralegalIds: readonly string[]
  actorId: string
}

@Injectable()
export class CaseManagementSeeder {
  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    private readonly legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    private readonly caseMembersRepository: CaseMembersRepository,
  ) {}

  async clear() {
    await this.caseMembersRepository.removeAll()
    await this.legalCasesRepository.removeAll()
  }

  async run(references?: CaseManagementSeedReferences) {
    if (!references) {
      throw new AppError('Case management seed references are required')
    }

    const [leadLawyerId] = references.lawyerIds

    if (!leadLawyerId || references.contractedIntakes.length === 0) {
      throw new AppError('Case management seed requirements are not met')
    }

    const legalCases = await this.legalCasesRepository.addMany(
      this.createLegalCaseSeeds(references.contractedIntakes),
    )

    const caseMembers = await this.caseMembersRepository.addMany(
      this.createCaseMemberSeeds({
        actorId: references.actorId,
        legalCases,
        lawyerIds: references.lawyerIds,
        paralegalIds: references.paralegalIds,
      }),
    )

    return { legalCases, caseMembers }
  }

  private createLegalCaseSeeds(
    contractedIntakes: readonly Intake[],
  ): LegalCaseCreation[] {
    const openedAt = new Date()

    return contractedIntakes.map((intake, index) => ({
      publicCode: this.createPublicCode(openedAt, index + 1),
      clientId: intake.clientId,
      intakeId: intake.id,
      legalAreaId: intake.legalAreaId,
      legalTopicId: intake.legalTopicId,
      title: this.getTitleByIndex(index),
      status: LegalCaseStatus.Documentation,
      openedAt,
    }))
  }

  private createCaseMemberSeeds({
    actorId,
    legalCases,
    lawyerIds,
    paralegalIds,
  }: {
    actorId: string
    legalCases: readonly LegalCase[]
    lawyerIds: readonly string[]
    paralegalIds: readonly string[]
  }): CaseMemberCreation[] {
    const [leadLawyerId] = lawyerIds
    const supportLawyerId = lawyerIds[1]
    const paralegalId = paralegalIds[0]

    if (!leadLawyerId) {
      throw new AppError('At least one lawyer is required to seed case members')
    }

    return legalCases.flatMap((legalCase) => {
      const members: CaseMemberCreation[] = [
        {
          caseId: legalCase.id,
          collaboratorId: leadLawyerId,
          role: CaseMemberRole.LeadLawyer,
          isPrimary: true,
          assignedAt: legalCase.openedAt,
          assignedBy: actorId,
        },
      ]

      if (supportLawyerId) {
        members.push({
          caseId: legalCase.id,
          collaboratorId: supportLawyerId,
          role: CaseMemberRole.Lawyer,
          isPrimary: false,
          assignedAt: legalCase.openedAt,
          assignedBy: actorId,
        })
      }

      if (paralegalId) {
        members.push({
          caseId: legalCase.id,
          collaboratorId: paralegalId,
          role: CaseMemberRole.Paralegal,
          isPrimary: false,
          assignedAt: legalCase.openedAt,
          assignedBy: actorId,
        })
      }

      return members
    })
  }

  private getTitleByIndex(index: number): string {
    const titles = [
      'Revisao contratual',
      'Divorcio consensual',
      'Verbas rescisorias',
      'Cobranca indevida',
      'Planejamento sucessorio',
    ]

    return titles[index % titles.length] ?? titles[0]
  }

  private createPublicCode(openedAt: Date, caseNumber: number): string {
    const date = openedAt.toISOString().slice(0, 10).replaceAll('-', '')
    const sequence = caseNumber.toString().padStart(4, '0')

    return `CASO-${date}-${sequence}`
  }
}
