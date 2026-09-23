import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { ErrorResponseDto, HealthResponseDto } from '@/shared/rest/dtos'

const { version } = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
) as { version: string }
const DATABASE_HEALTH_TIMEOUT_MS = 15_000

@Controller()
export class CheckHealthController {
  constructor(private readonly drizzleClient: DrizzleClient) {}

  @Get('/health')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The application and its dependencies are healthy.',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'One or more application dependencies are unavailable.',
    type: ErrorResponseDto,
  })
  async handle() {
    let timeout: NodeJS.Timeout | undefined
    const database = await Promise.race([
      this.drizzleClient.isHealthy(),
      new Promise<boolean>((resolve) => {
        timeout = setTimeout(() => {
          Logger.error('Database health query stalled; exiting to restore connectivity')
          resolve(false)
          process.exit(1)
        }, DATABASE_HEALTH_TIMEOUT_MS)
      }),
    ]).finally(() => {
      if (timeout) clearTimeout(timeout)
    })

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
      services: {
        database: 'UP',
        supabase: 'UP',
      },
    }
  }
}
