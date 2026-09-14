import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'
import type { IdProvider } from '#shared/interfaces/id-provider'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import {
  DynamicFormNameConflictError,
  IdempotencyKeyConflictError,
} from '../../domain/errors'
import type { DynamicFormAdministrationAuditRepository } from '../../interfaces/dynamic-form-administration-audit-repository'
import type { DynamicFormAdministrationRepository } from '../../interfaces/dynamic-form-administration-repository'
import type { DynamicFormDuplicateOperationsRepository } from '../../interfaces/dynamic-form-duplicate-operations-repository'
import type { LegalCatalogDatabase } from '../../interfaces/legal-catalog-database'
import type { DuplicateDynamicFormOperation } from '../../domain/structures/duplicate-dynamic-form-operation'
import { DuplicateDynamicFormUseCase } from '../duplicate-dynamic-form-use-case'

const now = new Date('2026-09-11T12:00:00.000Z')
const source: DynamicForm = {
  id: 'source-id',
  name: 'Ficha original',
  normalizedName: 'ficha original',
  description: 'Descrição',
  status: 'available',
  stage: 'consultation',
  legalAreaId: 'area-id',
  legalTopicIds: ['topic-1'],
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
  createdAt: new Date('2026-09-01T12:00:00.000Z'),
  updatedAt: new Date('2026-09-01T12:00:00.000Z'),
}

describe('Duplicate Dynamic Form Use Case', () => {
  let repository: MockProxy<DynamicFormAdministrationRepository>
  let operations: MockProxy<DynamicFormDuplicateOperationsRepository>
  let audit: MockProxy<DynamicFormAdministrationAuditRepository>
  let database: MockProxy<LegalCatalogDatabase>
  let idProvider: MockProxy<IdProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: DuplicateDynamicFormUseCase

  beforeEach(() => {
    repository = mock<DynamicFormAdministrationRepository>()
    operations = mock<DynamicFormDuplicateOperationsRepository>()
    audit = mock<DynamicFormAdministrationAuditRepository>()
    database = mock<LegalCatalogDatabase>()
    idProvider = mock<IdProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    database.transaction.mockImplementation(async (work) => work())
    datetimeProvider.now.mockReturnValue(now)
    useCase = new DuplicateDynamicFormUseCase(
      repository,
      operations,
      audit,
      database,
      idProvider,
      datetimeProvider,
    )
  })

  it('creates an unavailable copy, stores the replay and audits it', async () => {
    operations.findByOperationKey.mockResolvedValue(null)
    repository.findById.mockResolvedValue(source)
    repository.findByNormalizedName.mockResolvedValue(null)
    operations.addOrGet.mockImplementation(async (operation) => operation)
    idProvider.generate.mockReturnValueOnce('copy-id').mockReturnValueOnce('audit-id')

    const result = await useCase.execute({
      dynamicFormId: 'source-id',
      name: '  Ficha cópia  ',
      operationKey: 'operation-key',
      actorCollaboratorId: 'actor-id',
    })

    expect(result).toMatchObject({
      id: 'copy-id',
      name: 'Ficha cópia',
      normalizedName: 'ficha cópia',
      status: 'unavailable',
      legalTopicIds: ['topic-1'],
    })
    expect(repository.add).toHaveBeenCalledWith(result)
    expect(operations.addOrGet).toHaveBeenCalledWith(
      expect.objectContaining({
        operationKey: 'operation-key',
        sourceDynamicFormId: 'source-id',
        requestedNormalizedName: 'ficha cópia',
        result,
      }),
    )
    expect(audit.add).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'duplicated', dynamicFormId: 'copy-id' }),
    )
    expect(source.status).toBe('available')
  })

  it('returns the stored result for an identical replay', async () => {
    const replay = {
      operationKey: 'operation-key',
      sourceDynamicFormId: 'source-id',
      requestedNormalizedName: 'ficha cópia',
      actorCollaboratorId: 'actor-id',
      result: source,
      completedAt: now,
    }
    operations.findByOperationKey.mockResolvedValue(replay)

    await expect(
      useCase.execute({
        dynamicFormId: 'source-id',
        name: ' Ficha cópia ',
        operationKey: 'operation-key',
        actorCollaboratorId: 'actor-id',
      }),
    ).resolves.toBe(source)
    expect(repository.add).not.toHaveBeenCalled()
    expect(audit.add).not.toHaveBeenCalled()
  })

  it('raises named errors for conflicts and mismatched replays', async () => {
    operations.findByOperationKey.mockResolvedValue(null)
    repository.findById.mockResolvedValue(source)
    repository.findByNormalizedName.mockResolvedValue({ ...source, id: 'existing-id' })

    await expect(
      useCase.execute({
        dynamicFormId: 'source-id',
        name: 'Ficha original',
        operationKey: 'operation-key',
        actorCollaboratorId: 'actor-id',
      }),
    ).rejects.toBeInstanceOf(DynamicFormNameConflictError)

    operations.findByOperationKey.mockResolvedValue({
      operationKey: 'operation-key',
      sourceDynamicFormId: 'other-source',
      requestedNormalizedName: 'ficha cópia',
      actorCollaboratorId: 'actor-id',
      result: source,
      completedAt: now,
    })
    await expect(
      useCase.execute({
        dynamicFormId: 'source-id',
        name: 'Ficha cópia',
        operationKey: 'operation-key',
        actorCollaboratorId: 'actor-id',
      }),
    ).rejects.toBeInstanceOf(IdempotencyKeyConflictError)
  })

  it('returns one atomically stored result for concurrent requests with the same key', async () => {
    let storedOperation: DuplicateDynamicFormOperation | null = null
    let generatedId = 0
    operations.findByOperationKey.mockResolvedValue(null)
    repository.findById.mockResolvedValue(source)
    repository.findByNormalizedName.mockResolvedValue(null)
    idProvider.generate.mockImplementation(() => `generated-${++generatedId}`)
    operations.addOrGet.mockImplementation(async (operation) => {
      if (storedOperation) return storedOperation
      storedOperation = operation
      return operation
    })

    const request = {
      dynamicFormId: 'source-id',
      name: 'Ficha cópia',
      operationKey: 'operation-key',
      actorCollaboratorId: 'actor-id',
    }
    const results = await Promise.all([useCase.execute(request), useCase.execute(request)])

    expect(results[0]).toBe(results[1])
    expect(repository.add).toHaveBeenCalledTimes(1)
    expect(audit.add).toHaveBeenCalledTimes(1)
    expect(operations.addOrGet).toHaveBeenCalledTimes(2)
  })

  it('propagates the named atomic normalized-name conflict from the repository', async () => {
    operations.findByOperationKey.mockResolvedValue(null)
    repository.findById.mockResolvedValue(source)
    repository.findByNormalizedName.mockResolvedValue(null)
    repository.add.mockRejectedValue(
      new DynamicFormNameConflictError('existing-id'),
    )
    operations.addOrGet.mockImplementation(async (operation) => operation)

    await expect(
      useCase.execute({
        dynamicFormId: 'source-id',
        name: 'Ficha cópia',
        operationKey: 'different-operation-key',
        actorCollaboratorId: 'actor-id',
      }),
    ).rejects.toEqual(
      expect.objectContaining({ existingDynamicFormId: 'existing-id' }),
    )
    expect(repository.add).toHaveBeenCalledTimes(1)
    expect(audit.add).not.toHaveBeenCalled()
  })
})
