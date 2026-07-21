import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Controller, Get, HttpStatus, ServiceUnavailableException } from '@nestjs/common'

import { DatabaseService } from '../../database/database.service'

const { version } = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
) as { version: string }

@Controller()
export class CheckHealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('/health')
  async handle() {
    const database = await this.databaseService.isHealthy()

    if (!database) {
      throw new ServiceUnavailableException({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        status: 'not_ready',
        version,
        timestamp: new Date().toISOString(),
        services: { database: 'DOWN' },
      })
    }

    return {
      status: 'ok',
      version,
      timestamp: new Date().toISOString(),
      services: { database: 'UP' },
    }
  }
}
