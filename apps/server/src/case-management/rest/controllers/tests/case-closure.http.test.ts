import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { eq, sql } from 'drizzle-orm'
import {
  CaseChecklistGateDecision,
  CaseMemberRole,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import {
  CloseLegalCaseController,
  GetCaseClosureController,
  HomologateCaseDossierController,
  ReopenLegalCaseController,
  ReviewCaseChecklistGateController,
} from '@/case-management/rest/controllers'
import {
  caseClosureEventModel,
  legalCaseModel,
} from '@/case-management/database/drizzle/models'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

async function waitForLockingQuery(
  database: ReturnType<DrizzleClient['requireDatabase']>,
  queryFragment: string,
) {
  const deadline = Date.now() + 5_000
  while (Date.now() < deadline) {
    const waitingQueries = await database.execute<{ pid: number }>(sql`
      SELECT pid
      FROM pg_stat_activity
      WHERE wait_event_type = 'Lock'
        AND query ILIKE ${`%${queryFragment}%`}
        AND pid <> pg_backend_pid()
      LIMIT 1
    `)
    if (waitingQueries.length > 0) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error(
    `PostgreSQL did not observe a locked query containing ${queryFragment}.`,
  )
}

describe('Case closure HTTP flow [GET/POST /cases/:caseId/closure]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register([
      GetCaseClosureController,
      CloseLegalCaseController,
      ReopenLegalCaseController,
      ReviewCaseChecklistGateController,
      HomologateCaseDossierController,
    ])
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns every deadline, blocking-task and required-checklist blocker without changing lifecycle or history', async () => {
    const manager = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: manager.clientId,
      legalAreaId: manager.legalAreaId,
      legalTopicId: manager.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: manager.collaboratorId,
        role: CaseMemberRole.Manager,
      },
    ])
    const deadline = await fixture.registerCaseTask(legalCase.id, {
      type: 'process_deadline',
      title: 'Prazo de manifestação',
      blocksCaseClosure: false,
    })
    const task = await fixture.registerCaseTask(legalCase.id, {
      type: 'internal_task',
      title: 'Conferir documentos',
      blocksCaseClosure: true,
    })
    const [checklistItem] = await fixture.registerCaseChecklistItems([
      {
        caseId: legalCase.id,
        templateItemKey: 'required-proof',
        title: 'Comprovante obrigatório',
        isRequired: true,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/close`)
      .send({ outcome: 'agreement', notes: 'Desfecho conciliado.' })
      .expect(200)

    expect(response.body).toMatchObject({
      kind: 'blocked',
      blockers: expect.arrayContaining([
        expect.objectContaining({
          id: deadline.id,
          kind: 'legal_deadline',
          section: 'deadlines',
          href: `/advogado/meus-casos/${legalCase.id}?tab=prazos&taskId=${deadline.id}`,
        }),
        expect.objectContaining({
          id: task.id,
          kind: 'blocking_task',
          section: 'tasks',
          href: `/advogado/meus-casos/${legalCase.id}?tab=prazos&taskId=${task.id}`,
        }),
        expect.objectContaining({
          id: checklistItem?.id,
          kind: 'required_checklist_item',
          section: 'checklist',
          href: `/advogado/meus-casos/${legalCase.id}?tab=checklist&itemId=${checklistItem?.id}`,
        }),
      ]),
    })
    expect(response.body.blockers).toHaveLength(3)

    const database = fixture.app.get(DrizzleClient).requireDatabase()
    const [persistedCase] = await database
      .select({ lifecycleStatus: legalCaseModel.lifecycleStatus })
      .from(legalCaseModel)
      .where(eq(legalCaseModel.id, legalCase.id))
    const events = await database
      .select({ id: caseClosureEventModel.id })
      .from(caseClosureEventModel)
      .where(eq(caseClosureEventModel.caseId, legalCase.id))
    expect(persistedCase?.lifecycleStatus).toBe('active')
    expect(events).toEqual([])
  })

  it('persists a close, rejects event mutation, reopens and retains both lifecycle events and the closure record', async () => {
    const manager = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: manager.clientId,
      legalAreaId: manager.legalAreaId,
      legalTopicId: manager.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: manager.collaboratorId,
        role: CaseMemberRole.Manager,
      },
    ])

    const closed = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/close`)
      .send({ outcome: 'agreement', notes: 'Acordo confirmado.' })
      .expect(200)
    expect(closed.body).toMatchObject({
      kind: 'closed',
      legalCase: { lifecycleStatus: 'closed' },
      closure: {
        outcome: 'agreement',
        notes: 'Acordo confirmado.',
        closedBy: manager.collaboratorId,
      },
      event: { type: 'closed', actorId: manager.collaboratorId },
    })

    const database = fixture.app.get(DrizzleClient).requireDatabase()
    await expect(
      database
        .delete(caseClosureEventModel)
        .where(eq(caseClosureEventModel.id, closed.body.event.id)),
    ).rejects.toMatchObject({ cause: { code: '55000' } })

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/reopen`)
      .send({ reason: 'Nova evidência documental.' })
      .expect(200)

    const reopened = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/closure`)
      .expect(200)
    expect(reopened.body.legalCase.lifecycleStatus).toBe('active')
    expect(reopened.body.closure).toMatchObject({
      outcome: 'agreement',
      notes: 'Acordo confirmado.',
      closedBy: manager.collaboratorId,
      closedByName: manager.professionalName,
    })
    expect(reopened.body.events).toHaveLength(2)
    expect(reopened.body.events.map((event: { type: string }) => event.type)).toEqual([
      'reopened',
      'closed',
    ])
    expect(reopened.body.events[0]).toMatchObject({
      reason: 'Nova evidência documental.',
      actorId: manager.collaboratorId,
      actorName: manager.professionalName,
    })
    expect(reopened.body.events[1]).toMatchObject({
      actorId: manager.collaboratorId,
      actorName: manager.professionalName,
    })
  })

  it('rejects a blank reopening reason and preserves the closed state', async () => {
    const manager = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: manager.clientId,
      legalAreaId: manager.legalAreaId,
      legalTopicId: manager.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: manager.collaboratorId,
        role: CaseMemberRole.Manager,
      },
    ])
    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/close`)
      .send({ outcome: 'favorable' })
      .expect(200)

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/reopen`)
      .send({ reason: '   ' })
      .expect(400)

    const snapshot = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/closure`)
      .expect(200)
    expect(snapshot.body.legalCase.lifecycleStatus).toBe('closed')
    expect(snapshot.body.events).toHaveLength(1)
  })

  it('denies closure when the current actor is not the case Manager even when their profile is eligible', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: CaseMemberRole.Collaborator,
      },
    ])

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/close`)
      .send({ outcome: 'favorable' })
      .expect(403)

    const snapshot = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/closure`)
      .expect(200)
    expect(snapshot.body.legalCase.lifecycleStatus).toBe('active')
    expect(snapshot.body.events).toEqual([])
  })

  it('denies a case Manager whose collaborator profile is not eligible', async () => {
    const actor = await fixture.registerCollaborator({ profile: 'attendant' })
    const legalCase = await fixture.registerLegalCase({
      clientId: actor.clientId,
      legalAreaId: actor.legalAreaId,
      legalTopicId: actor.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: actor.collaboratorId,
        role: CaseMemberRole.Manager,
      },
    ])

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/close`)
      .send({ outcome: 'favorable' })
      .expect(403)

    const database = fixture.app.get(DrizzleClient).requireDatabase()
    const [persistedCase] = await database
      .select({ lifecycleStatus: legalCaseModel.lifecycleStatus })
      .from(legalCaseModel)
      .where(eq(legalCaseModel.id, legalCase.id))
    const events = await database
      .select({ id: caseClosureEventModel.id })
      .from(caseClosureEventModel)
      .where(eq(caseClosureEventModel.caseId, legalCase.id))
    expect(persistedCase?.lifecycleStatus).toBe('active')
    expect(events).toEqual([])
  })

  it('does not review the checklist gate if the case closes while its write is waiting', async () => {
    const manager = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: manager.clientId,
      legalAreaId: manager.legalAreaId,
      legalTopicId: manager.legalTopicId,
      status: LegalCaseStatus.Documentation,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: manager.collaboratorId,
        role: CaseMemberRole.Manager,
      },
    ])
    const database = fixture.app.get(DrizzleClient).requireDatabase()
    let releaseLock = () => {}
    const lockReleased = new Promise<void>((resolve) => {
      releaseLock = resolve
    })
    let lockAcquired = () => {}
    const acquired = new Promise<void>((resolve) => {
      lockAcquired = resolve
    })
    const closing = database.transaction(async (transaction) => {
      await transaction
        .select({ id: legalCaseModel.id })
        .from(legalCaseModel)
        .where(eq(legalCaseModel.id, legalCase.id))
        .for('update')
      lockAcquired()
      await lockReleased
      await transaction
        .update(legalCaseModel)
        .set({ lifecycleStatus: 'closed' })
        .where(eq(legalCaseModel.id, legalCase.id))
    })
    await acquired

    const review = request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/checklist-gate`)
      .send({
        decision: CaseChecklistGateDecision.ApprovedWithException,
        remarks: 'Exceção registrada.',
      })
      .then((response) => response)
    try {
      await waitForLockingQuery(database, 'update%cases%')
    } finally {
      releaseLock()
    }
    await closing
    expect((await review).status).toBe(409)

    const [persistedCase] = await database
      .select({
        lifecycleStatus: legalCaseModel.lifecycleStatus,
        status: legalCaseModel.status,
        checklistGateDecision: legalCaseModel.checklistGateDecision,
        checklistGateDecidedBy: legalCaseModel.checklistGateDecidedBy,
      })
      .from(legalCaseModel)
      .where(eq(legalCaseModel.id, legalCase.id))
    expect(persistedCase).toMatchObject({
      lifecycleStatus: 'closed',
      status: LegalCaseStatus.Documentation,
      checklistGateDecision: null,
      checklistGateDecidedBy: null,
    })
  })

  it('reads the case and lifecycle events from one database snapshot during a concurrent close', async () => {
    const manager = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: manager.clientId,
      legalAreaId: manager.legalAreaId,
      legalTopicId: manager.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: manager.collaboratorId,
        role: CaseMemberRole.Manager,
      },
    ])
    const database = fixture.app.get(DrizzleClient).requireDatabase()

    let releaseLock = () => {}
    const lockReleased = new Promise<void>((resolve) => {
      releaseLock = resolve
    })
    let lockAcquired = () => {}
    const acquired = new Promise<void>((resolve) => {
      lockAcquired = resolve
    })
    const blockerLock = database.transaction(async (transaction) => {
      await transaction.execute(sql`LOCK TABLE case_tasks IN ACCESS EXCLUSIVE MODE`)
      lockAcquired()
      await lockReleased
    })
    await acquired

    const snapshotRequest = request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/closure`)
      .then((response) => response)
    try {
      await waitForLockingQuery(database, 'case_tasks')
      const closedAt = new Date()
      await database
        .update(legalCaseModel)
        .set({
          lifecycleStatus: 'closed',
          closureOutcome: 'agreement',
          closureNotes: 'Fechado durante a leitura.',
          closedAt,
          closedBy: manager.collaboratorId,
        })
        .where(eq(legalCaseModel.id, legalCase.id))
      await database.insert(caseClosureEventModel).values({
        caseId: legalCase.id,
        type: 'closed',
        actorId: manager.collaboratorId,
        occurredAt: closedAt,
        outcome: 'agreement',
        notes: 'Fechado durante a leitura.',
      })
    } finally {
      releaseLock()
    }
    await blockerLock

    const snapshot = await snapshotRequest
    expect(snapshot.status).toBe(200)
    expect(snapshot.body.legalCase.lifecycleStatus).toBe('active')
    expect(snapshot.body.closure).toBeUndefined()
    expect(snapshot.body.events).toEqual([])
  })
})
