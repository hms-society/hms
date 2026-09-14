import { Inject, Injectable } from '@nestjs/common'
import type { DuplicateDynamicFormOperation } from '@hms/core/legal-catalog/domain/structures'
import type { DynamicFormDuplicateOperationsRepository } from '@hms/core/legal-catalog/interfaces'
import { eq } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'
import { dynamicFormDuplicateOperationModel } from '@/legal-catalog/database/drizzle/models'

@Injectable()
export class DrizzleDynamicFormDuplicateOperationsRepository
  extends DrizzleRepository
  implements DynamicFormDuplicateOperationsRepository
{
  constructor(@Inject(DrizzleClient) drizzle: DrizzleClient) {
    super(drizzle)
  }

  async findByOperationKey(
    operationKey: string,
  ): Promise<DuplicateDynamicFormOperation | null> {
    const [record] = await this.database
      .select()
      .from(dynamicFormDuplicateOperationModel)
      .where(
        // The operation key is the primary key, so this read is serialized by
        // PostgreSQL when it runs inside the duplicate transaction.
        eq(dynamicFormDuplicateOperationModel.operationKey, operationKey),
      )

    if (!record) return null

    const result = record.result
    return {
      operationKey: record.operationKey,
      sourceDynamicFormId: record.sourceDynamicFormId,
      requestedNormalizedName: record.requestedNormalizedName,
      actorCollaboratorId: record.actorCollaboratorId,
      result: {
        ...result,
        createdAt: new Date(result.createdAt),
        updatedAt: new Date(result.updatedAt),
      },
      completedAt: record.completedAt,
    }
  }

  async addOrGet(
    operation: DuplicateDynamicFormOperation,
  ): Promise<DuplicateDynamicFormOperation> {
    await this.database
      .insert(dynamicFormDuplicateOperationModel)
      .values({
        operationKey: operation.operationKey,
        sourceDynamicFormId: operation.sourceDynamicFormId,
        requestedNormalizedName: operation.requestedNormalizedName,
        actorCollaboratorId: operation.actorCollaboratorId,
        result: operation.result,
        completedAt: operation.completedAt,
      })
      .onConflictDoNothing({
        target: dynamicFormDuplicateOperationModel.operationKey,
      })

    const stored = await this.findByOperationKey(operation.operationKey)
    if (!stored) throw new Error('Duplicate operation was not persisted')
    return stored
  }
}
