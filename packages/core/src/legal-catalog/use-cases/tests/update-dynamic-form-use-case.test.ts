import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import {
  DynamicFormVersionConflictError,
  IdempotencyKeyConflictError,
} from '../../domain/errors'
import type { UpdateDynamicFormRequest } from '../../domain/structures/update-dynamic-form-request'
import type { DynamicFormReplaceResult } from '../../domain/structures/dynamic-form-replace-result'
import type { DynamicFormAdministrationAuditRepository } from '../../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import type { DynamicFormOperationsRepository } from '../../interfaces/dynamic-form-operations-repository'
import type { LegalAreasRepository } from '../../interfaces/legal-areas-repository'
import type { LegalCatalogDatabase } from '../../interfaces/legal-catalog-database'
import type { LegalTopicsRepository } from '../../interfaces/legal-topics-repository'
import { UpdateDynamicFormUseCase } from '../update-dynamic-form-use-case'
import type { ValidateDynamicFormDefinitionUseCase } from '../validate-dynamic-form-definition-use-case'

const now = new Date('2026-09-15T12:00:00.000Z')
const currentForm: DynamicForm = {
  id: 'form-id',
  name: 'Ficha',
  normalizedName: 'ficha',
  description: null,
  status: 'available',
  stage: 'consultation',
  legalAreaId: 'area-id',
  legalTopicIds: ['topic-id'],
  fields: [
    {
      id: 'field-id',
      key: 'answer',
      label: 'Resposta',
      type: 'short_text',
      position: 0,
      required: true,
    },
  ],
  version: 2,
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
}
const nextFields = [{ ...currentForm.fields[0], label: 'Resposta atualizada' }]
const request: UpdateDynamicFormRequest = {
  dynamicFormId: 'form-id',
  name: 'Ficha atualizada',
  stage: 'consultation',
  legalAreaId: 'area-id',
  legalTopicIds: ['topic-id'],
  fields: [
    {
      fieldId: 'field-id',
      label: 'Resposta atualizada',
      type: 'short_text',
      required: true,
    },
  ],
  expectedVersion: 2,
  operationKey: 'operation-key',
  actorCollaboratorId: 'actor-id',
}

describe('Update Dynamic Form Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let areas: MockProxy<LegalAreasRepository>
  let topics: MockProxy<LegalTopicsRepository>
  let operations: MockProxy<DynamicFormOperationsRepository>
  let audit: MockProxy<DynamicFormAdministrationAuditRepository>
  let database: MockProxy<LegalCatalogDatabase>
  let validator: MockProxy<ValidateDynamicFormDefinitionUseCase>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let idProvider: MockProxy<IdProvider>
  let useCase: UpdateDynamicFormUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    areas = mock<LegalAreasRepository>()
    topics = mock<LegalTopicsRepository>()
    operations = mock<DynamicFormOperationsRepository>()
    audit = mock<DynamicFormAdministrationAuditRepository>()
    database = mock<LegalCatalogDatabase>()
    validator = mock<ValidateDynamicFormDefinitionUseCase>()
    datetimeProvider = mock<DatetimeProvider>()
    idProvider = mock<IdProvider>()
    database.transaction.mockImplementation(async (work) => work())
    repository.findById.mockResolvedValue(currentForm)
    repository.findByNormalizedName.mockResolvedValue(null)
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
    validator.execute.mockResolvedValue(nextFields)
    operations.findByOperationKey.mockResolvedValue(null)
    operations.addOrGet.mockImplementation(async (operation) => operation)
    datetimeProvider.now.mockReturnValue(now)
    idProvider.generate.mockReturnValue('audit-id')
    useCase = new UpdateDynamicFormUseCase(
      repository,
      areas,
      topics,
      operations,
      audit,
      database,
      validator,
      datetimeProvider,
      idProvider,
    )
  })

  it('replaces the complete definition, increments once and audits the field diff', async () => {
    const updated: DynamicForm = {
      ...currentForm,
      name: 'Ficha atualizada',
      normalizedName: 'ficha atualizada',
      fields: nextFields,
      version: 3,
      updatedAt: now,
    }
    const replacement: DynamicFormReplaceResult = { kind: 'updated', form: updated }
    repository.replace.mockResolvedValue(replacement)

    await expect(useCase.execute(request)).resolves.toBe(updated)
    expect(repository.replace).toHaveBeenCalledWith(
      'form-id',
      expect.objectContaining({ name: 'Ficha atualizada', fields: nextFields }),
      2,
    )
    expect(audit.add).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'updated',
        details: expect.objectContaining({
          previousVersion: 2,
          nextVersion: 3,
          changedFieldIds: ['field-id'],
        }),
      }),
    )
  })

  it('stores an unchanged replay without creating an audit entry', async () => {
    const unchanged = { ...currentForm }
    repository.replace.mockResolvedValue({ kind: 'unchanged', form: unchanged })

    await expect(useCase.execute(request)).resolves.toBe(unchanged)
    expect(audit.add).not.toHaveBeenCalled()
    expect(operations.addOrGet).toHaveBeenCalledWith(
      expect.objectContaining({ result: unchanged }),
    )
  })

  it('raises a stale version conflict without persisting or auditing', async () => {
    repository.replace.mockResolvedValue({ kind: 'version_conflict', currentVersion: 3 })

    await expect(useCase.execute(request)).rejects.toEqual(
      expect.objectContaining({
        dynamicFormId: 'form-id',
        expectedVersion: 2,
        currentVersion: 3,
      }),
    )
    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      DynamicFormVersionConflictError,
    )
    expect(operations.addOrGet).not.toHaveBeenCalled()
    expect(audit.add).not.toHaveBeenCalled()
  })

  it('replays the concurrent winner after losing the version predicate', async () => {
    const updated: DynamicForm = {
      ...currentForm,
      name: 'Ficha atualizada',
      normalizedName: 'ficha atualizada',
      fields: nextFields,
      version: 3,
      updatedAt: now,
    }
    operations.findByOperationKey.mockResolvedValueOnce(null).mockResolvedValueOnce({
      operationKey: request.operationKey,
      action: 'updated',
      actorCollaboratorId: request.actorCollaboratorId,
      targetDynamicFormId: request.dynamicFormId,
      expectedVersion: request.expectedVersion,
      canonicalRequest: {
        kind: 'updated',
        definition: {
          name: 'Ficha atualizada',
          stage: 'consultation',
          legalAreaId: 'area-id',
          legalTopicIds: ['topic-id'],
          fields: request.fields,
        },
      },
      result: updated,
      completedAt: now,
    })
    repository.replace.mockResolvedValue({
      kind: 'version_conflict',
      currentVersion: 3,
    })

    await expect(useCase.execute(request)).resolves.toBe(updated)
    expect(operations.findByOperationKey).toHaveBeenCalledTimes(2)
    expect(operations.addOrGet).not.toHaveBeenCalled()
    expect(audit.add).not.toHaveBeenCalled()
  })

  it('replays a stored no-op result before evaluating the current version', async () => {
    operations.findByOperationKey.mockResolvedValue({
      operationKey: request.operationKey,
      action: 'updated',
      actorCollaboratorId: request.actorCollaboratorId,
      targetDynamicFormId: request.dynamicFormId,
      expectedVersion: request.expectedVersion,
      canonicalRequest: {
        kind: 'updated',
        definition: {
          name: 'Ficha atualizada',
          stage: 'consultation',
          legalAreaId: 'area-id',
          legalTopicIds: ['topic-id'],
          fields: request.fields,
        },
      },
      result: currentForm,
      completedAt: now,
    })

    await expect(useCase.execute(request)).resolves.toBe(currentForm)
    expect(repository.findById).not.toHaveBeenCalled()
  })

  it('rejects a reused operation key with different update identity', async () => {
    operations.findByOperationKey.mockResolvedValue({
      operationKey: request.operationKey,
      action: 'created',
      actorCollaboratorId: request.actorCollaboratorId,
      targetDynamicFormId: 'other-form',
      expectedVersion: null,
      canonicalRequest: { kind: 'created', definition: request },
      result: currentForm,
      completedAt: now,
    })

    await expect(useCase.execute(request)).rejects.toBeInstanceOf(
      IdempotencyKeyConflictError,
    )
  })
})
