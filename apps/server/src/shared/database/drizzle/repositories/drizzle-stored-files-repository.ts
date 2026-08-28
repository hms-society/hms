import { Injectable } from '@nestjs/common'
import type { File } from '@hms/core/shared/domain/entities'
import type { StoredFilesRepository } from '@hms/core/shared/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import { eq } from 'drizzle-orm'

import { StoredFileMapper } from '@/shared/database/drizzle/mappers/stored-file-mapper'
import { storedFileModel } from '@/shared/database/drizzle/models/stored-file-model'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

@Injectable()
export class DrizzleStoredFilesRepository
  extends DrizzleRepository
  implements StoredFilesRepository
{
  constructor(
    drizzle: DrizzleClient,
    private readonly mapper: StoredFileMapper,
  ) {
    super(drizzle)
  }

  async add(file: File): Promise<File> {
    const [record] = await this.database.insert(storedFileModel).values(file).returning()

    if (!record) {
      throw new AppError(
        'Não foi possível persistir os metadados do arquivo.',
        'Erro de Persistência',
      )
    }

    return this.mapper.toDomain(record)
  }

  async findById(fileId: string): Promise<File | null> {
    const [record] = await this.database
      .select()
      .from(storedFileModel)
      .where(eq(storedFileModel.id, fileId))
      .limit(1)

    return record ? this.mapper.toDomain(record) : null
  }

  async remove(fileId: string): Promise<void> {
    await this.database.delete(storedFileModel).where(eq(storedFileModel.id, fileId))
  }
}
