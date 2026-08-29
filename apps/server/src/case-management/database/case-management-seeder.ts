import { Inject, Injectable } from '@nestjs/common'
import type {
  LegalCase,
  CaseMemberCreation,
  LegalCaseCreation,
} from '@hms/core/case-management/domain/entities'
import {
  CaseMemberRole,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'
import type {
  CaseMembersRepository,
  CaseChecklistItemsRepository,
  LegalCasesRepository,
} from '@hms/core/case-management/interfaces'
import type { Intake } from '@hms/core/intake/domain/entities'
import { AppError } from '@hms/core/shared/domain/errors'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'

export type CaseManagementSeedReferences = {
  contractedIntakes: readonly Intake[]
  lawyerIds: readonly string[]
  paralegalIds: readonly string[]
  supervisorIds: readonly string[]
  actorId: string
  validationScenarioClientId?: string
}

@Injectable()
export class CaseManagementSeeder {
  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    private readonly legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    private readonly caseMembersRepository: CaseMembersRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
  ) {}

  async clear() {
    await this.caseChecklistItemsRepository.removeAll()
    await this.caseMembersRepository.removeAll()
    await this.legalCasesRepository.removeAll()
  }

  async run(references?: CaseManagementSeedReferences) {
    if (!references) {
      throw new AppError('Case management seed references are required')
    }

    if (references.lawyerIds.length === 0 || references.contractedIntakes.length === 0) {
      throw new AppError('Case management seed requirements are not met')
    }

    const legalCases = await this.legalCasesRepository.addMany(
      this.createLegalCaseSeeds(
        references.contractedIntakes.slice(0, 8),
        references.validationScenarioClientId,
      ),
    )

    const caseMembers = await this.caseMembersRepository.addMany(
      this.createCaseMemberSeeds({
        actorId: references.actorId,
        legalCases,
        lawyerIds: references.lawyerIds,
        paralegalIds: references.paralegalIds,
        supervisorIds: references.supervisorIds,
      }),
    )

    const validationScenarioCase = legalCases.find(
      (legalCase) => legalCase.clientId === references.validationScenarioClientId,
    )
    const validationScenarioChecklistItems = validationScenarioCase
      ? await this.caseChecklistItemsRepository.addMany(
          this.createValidationScenarioChecklistItems(validationScenarioCase.id),
        )
      : []

    return {
      legalCases,
      caseMembers,
      validationScenarioCase,
      validationScenarioChecklistItems,
    }
  }

  private createValidationScenarioChecklistItems(
    caseId: string,
  ): Parameters<CaseChecklistItemsRepository['addMany']>[0] {
    return [
      {
        caseId,
        templateItemKey: 'Documento teste 1',
        title: 'Documento teste 1',
        isRequired: true,
      },
      {
        caseId,
        templateItemKey: 'documento teste 2',
        title: 'Documento teste 2',
        isRequired: true,
      },
      {
        caseId,
        templateItemKey: 'comprovante-residencia',
        title: 'Comprovante de residência',
        isRequired: true,
      },
      {
        caseId,
        templateItemKey: 'comprovante-vinculo',
        title: 'Comprovante de vínculo previdenciário',
        isRequired: true,
      },
      {
        caseId,
        templateItemKey: 'ctps-carteira-trabalho',
        title: 'CTPS - Carteira de Trabalho',
        isRequired: true,
      },
    ]
  }

  private createLegalCaseSeeds(
    contractedIntakes: readonly Intake[],
    validationScenarioClientId?: string,
  ): LegalCaseCreation[] {
    const openedAt = new Date()

    return contractedIntakes.map((intake, index) => {
      if (!intake.legalAreaId || !intake.legalTopicId) {
        throw new AppError(
          'Contracted intake legal references are required to seed a case',
        )
      }

      return {
        publicCode: this.createPublicCode(openedAt, index + 1),
        clientId: intake.clientId,
        intakeId: intake.id,
        legalAreaId: intake.legalAreaId,
        legalTopicId: intake.legalTopicId,
        title:
          intake.clientId === validationScenarioClientId
            ? 'Checklist documental previdenciário - Vinicius Lopes Machado'
            : this.getTitleByIndex(index),
        status: LegalCaseStatus.Documentation,
        openedAt,
      }
    })
  }

  private createCaseMemberSeeds({
    actorId,
    legalCases,
    lawyerIds,
    paralegalIds,
    supervisorIds,
  }: {
    actorId: string
    legalCases: readonly LegalCase[]
    lawyerIds: readonly string[]
    paralegalIds: readonly string[]
    supervisorIds: readonly string[]
  }): CaseMemberCreation[] {
    if (lawyerIds.length === 0) {
      throw new AppError('At least one lawyer is required to seed case teams')
    }

    return legalCases.flatMap((legalCase, caseIndex) => {
      const leadLawyerId = lawyerIds[0]
      const supportingLawyerIds = this.pickCollaboratorIds(
        lawyerIds.filter((lawyerId) => lawyerId !== leadLawyerId),
        caseIndex,
        1,
      )

      const teamMembers = [
        {
          caseId: legalCase.id,
          collaboratorId: leadLawyerId,
          role: CaseMemberRole.LeadLawyer,
          isPrimary: true,
          assignedAt: legalCase.openedAt,
          assignedBy: actorId,
        },
        ...supportingLawyerIds.map((collaboratorId) => ({
          caseId: legalCase.id,
          collaboratorId,
          role: CaseMemberRole.Lawyer,
          isPrimary: false,
          assignedAt: legalCase.openedAt,
          assignedBy: actorId,
        })),
        ...this.pickCollaboratorIds(paralegalIds, caseIndex, 1).map((collaboratorId) => ({
          caseId: legalCase.id,
          collaboratorId,
          role: CaseMemberRole.Paralegal,
          isPrimary: false,
          assignedAt: legalCase.openedAt,
          assignedBy: actorId,
        })),
        ...this.pickCollaboratorIds(supervisorIds, caseIndex, 1).map(
          (collaboratorId) => ({
            caseId: legalCase.id,
            collaboratorId,
            role: CaseMemberRole.Supervisor,
            isPrimary: false,
            assignedAt: legalCase.openedAt,
            assignedBy: actorId,
          }),
        ),
      ] satisfies CaseMemberCreation[]

      return teamMembers
    })
  }

  private pickCollaboratorIds(
    collaboratorIds: readonly string[],
    seedIndex: number,
    count: number,
  ): string[] {
    if (collaboratorIds.length === 0) return []

    return Array.from({ length: Math.min(count, collaboratorIds.length) }, (_, index) => {
      return collaboratorIds[(seedIndex + index) % collaboratorIds.length]
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
