import type { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'

export async function registerManagedCase(fixture: CaseManagementModuleFixture) {
  const actor = await fixture.registerCollaborator()
  const legalCase = await fixture.registerLegalCase({
    clientId: actor.clientId,
    legalAreaId: actor.legalAreaId,
    legalTopicId: actor.legalTopicId,
  })
  const [manager] = await fixture.registerCaseMembers([
    {
      caseId: legalCase.id,
      collaboratorId: actor.collaboratorId,
      role: 'manager',
    },
  ])
  if (!manager) throw new Error('Case manager fixture was not created')
  return { actor, legalCase, manager }
}
