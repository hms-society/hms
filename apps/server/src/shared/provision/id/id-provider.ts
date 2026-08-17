import { randomUUID } from 'node:crypto'

import { Injectable } from '@nestjs/common'
import type { IdProvider as IdProviderContract } from '@hms/core/shared/interfaces'

@Injectable()
export class IdProvider implements IdProviderContract {
  generate(): string {
    return randomUUID()
  }
}
