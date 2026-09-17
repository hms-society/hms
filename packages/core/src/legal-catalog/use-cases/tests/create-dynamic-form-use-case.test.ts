import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import {
  DynamicFormDefinitionValidationError,
  IdempotencyKeyConflictError,
} from '../../domain/errors'
import type { CreateDynamicFormRequest } from '../../domain/structures/create-dynamic-form-request'
import type { DynamicFormDefinitionField } from '../../domain/entities/dynamic-form-definition-field'
import type { DynamicFormAdministrationAuditRepository } from '../../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import type { DynamicFormOperationsRepository } from '../../interfaces/dynamic-form-operations-repository'
import type { LegalAreasRepository } from '../../interfaces/legal-areas-repository'
import type { LegalCatalogDatabase } from '../../interfaces/legal-catalog-database'
import type { LegalTopicsRepository } from '../../interfaces/legal-topics-repository'
import { CreateDynamicFormUseCase } from '../create-dynamic-form-use-case'
import type { ValidateDynamicFormDefinitionUseCase } from '../validate-dynamic-form-definition-use-case'

const now = new Date('2026-09-15T12:00:00.000Z')
const fields: DynamicFormDefinitionField[] = [
  {
    id: 'field-id',
    key: 'answer',
    label: 'Resposta',
    type: 'short_text',
    position: 0,
    required: true,
  },
]
const request: CreateDynamicFormRequest = {
  name: '  Nova ficha  ',
  description: '  Descrição  ',
  stage: 'consultation',
  legalAreaId: 'area-id',
  legalTopicIds: ['topic-id'],
  fields: [{ label: 'Resposta', type: 'short_text', required: true }],
  operationKey: 'operation-key',
  actorCollaboratorId: 'actor-id',
}

describe('Create Dynamic Form Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let areas: MockProxy<LegalAreasRepository>
  let topics: MockProxy<LegalTopicsRepository>
  let operations: MockProxy<DynamicFormOperationsRepository>
  let audit: MockProxy<DynamicFormAdministrationAuditRepository>
  let database: MockProxy<LegalCatalogDatabase>
  let validator: MockProxy<ValidateDynamicFormDefinitionUseCase>
  let idProvider: MockProxy<IdProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: CreateDynamicFormUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    areas = mock<LegalAreasRepository>()
    topics = mock<LegalTopicsRepository>()
    operations = mock<DynamicFormOperationsRepository>()
    audit = mock<DynamicFormAdministrationAuditRepository>()
    database = mock<LegalCatalogDatabase>()
    validator = mock<ValidateDynamicFormDefinitionUseCase>()
    idProvider = mock<IdProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    database.transaction.mockImplementation(async (work) => work())
    areas.findByIds.mockResolvedValue([
      { id: 'area-id', name: 'Área', active: true, createdAt: now, updatedAt: now },
    ])
    topics.findByIds.mockResolvedValue([
      {
        id: 'topic-id',
        legalAreaId: 'area-id',
        name: 'Tema',
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ])
    validator.execute.mockResolvedValue(fields)
    operations.findByOperationKey.mockResolvedValue(null)
    operations.addOrGet.mockImplementation(async (operation) => operation)
    repository.findByNormalizedName.mockResolvedValue(null)
    idProvider.generate.mockReturnValueOnce('form-id').mockReturnValueOnce('audit-id')
    datetimeProvider.now.mockReturnValue(now)
    useCase = new CreateDynamicFormUseCase(
      repository,
      areas,
      topics,
      operations,
      audit,
      database,
      validator,
      idProvider,
      datetimeProvider,
    )
  })

  it('creates an unavailable version-one definition and one audit entry atomically', async () => {
    const result = await useCase.execute(request)

    expect(result).toMatchObject({
      id: 'form-id',
      name: 'Nova ficha',
      normalizedName: 'nova ficha',
      description: 'Descrição',
      status: 'unavailable',
      version: 1,
      fields,
      createdAt: now,
      updatedAt: now,
    })
    expect(repository.add).toHaveBeenCalledWith(result)
    expect(operations.addOrGet).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'created',
        targetDynamicFormId: 'form-id',
        result,
      }),
    )
    expect(audit.add).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'created', operationKey: 'operation-key' }),
    )
  })

  it('returns an exact replay without creating or auditing again', async () => {
    const replay: DynamicForm = {
      id: 'replayed-form',
      name: 'Nova ficha',
      normalizedName: 'nova ficha',
      description: 'Descrição',
      status: 'unavailable',
      stage: 'consultation',
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields,
      version: 1,
      createdAt: now,
      updatedAt: now,
    }
    operations.findByOperationKey.mockResolvedValue({
      operationKey: request.operationKey,
      action: 'created',
      actorCollaboratorId: request.actorCollaboratorId,
      targetDynamicFormId: replay.id,
      expectedVersion: null,
      canonicalRequest: {
        kind: 'created',
        definition: {
          name: 'Nova ficha',
          description: 'Descrição',
          stage: 'consultation',
          legalAreaId: 'area-id',
          legalTopicIds: ['topic-id'],
          fields: request.fields,
        },
      },
      result: replay,
      completedAt: now,
    })

    await expect(useCase.execute(request)).resolves.toBe(replay)
    expect(repository.add).not.toHaveBeenCalled()
    expect(audit.add).not.toHaveBeenCalled()
  })

  it('rejects inactive classification before persistence', async () => {
    areas.findByIds.mockResolvedValue([
      { id: 'area-id', name: 'Área', active: false, createdAt: now, updatedAt: now },
    ])

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      DynamicFormDefinitionValidationError,
    )
    expect(repository.add).not.toHaveBeenCalled()
  })

  it('raises a global idempotency conflict for a reused key with another request', async () => {
    operations.findByOperationKey.mockResolvedValue({
      operationKey: request.operationKey,
      action: 'duplicated',
      actorCollaboratorId: request.actorCollaboratorId,
      targetDynamicFormId: 'other-form',
      expectedVersion: null,
      canonicalRequest: {
        kind: 'duplicated',
        sourceDynamicFormId: 'source-form',
        normalizedName: 'outra ficha',
      },
      result: { ...({} as DynamicForm), id: 'other-form' },
      completedAt: now,
    })

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      IdempotencyKeyConflictError,
    )
  })
})
