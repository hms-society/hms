import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import type { Response } from 'express'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { HealthResponseDto } from '@/shared/rest/dtos'

const { version } = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf-8'),
) as { version: string }
const DEPENDENCY_TIMEOUT_MS = 5_000

type HealthStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'NOT_CONFIGURED'

@Controller()
export class CheckHealthController {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly envProvider: EnvProvider,
  ) {}

  @Get('/health')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The server is ready, with individual dependency states.',
    type: HealthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'A required dependency is unavailable.',
    type: HealthResponseDto,
  })
  async checkReadiness(@Res({ passthrough: true }) response: Response) {
    const supabaseHeaders = {
      apikey: this.envProvider.get('SUPABASE_SERVICE_ROLE_KEY'),
    }
    const [database, supabaseAuth, storage, inngest, documenso] = await Promise.all([
      this.checkDatabase(),
      this.checkHttp(
        this.envProvider.get('SUPABASE_URL'),
        '/auth/v1/health',
        supabaseHeaders,
      ),
      this.checkHttp(
        this.envProvider.get('SUPABASE_URL'),
        '/storage/v1/status',
        supabaseHeaders,
      ),
      this.checkInngestHandler(),
      this.checkDocumenso(),
    ])

    const services = {
      database,
      'supabase-auth': supabaseAuth,
      storage,
      inngest,
      documenso,
    }
    const isReady = database === 'UP' && supabaseAuth === 'UP'
    const status = !isReady
      ? 'not_ready'
      : Object.values(services).every((service) => service === 'UP')
        ? 'ok'
        : 'degraded'

    if (!isReady) response.status(HttpStatus.SERVICE_UNAVAILABLE)

    return { status, version, timestamp: new Date().toISOString(), services }
  }

  private async checkDatabase(): Promise<HealthStatus> {
    let timeout: NodeJS.Timeout | undefined
    try {
      const isHealthy = await Promise.race([
        this.drizzleClient.isHealthy(),
        new Promise<boolean>((resolve) => {
          timeout = setTimeout(() => resolve(false), DEPENDENCY_TIMEOUT_MS)
        }),
      ])
      return isHealthy ? 'UP' : 'DOWN'
    } catch {
      return 'DOWN'
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }

  private async checkHttp(
    baseUrl: string,
    path: string,
    headers?: HeadersInit,
  ): Promise<HealthStatus> {
    try {
      const result = await fetch(new URL(path, baseUrl), {
        headers,
        redirect: 'error',
        signal: AbortSignal.timeout(DEPENDENCY_TIMEOUT_MS),
      })
      await result.body?.cancel()
      return result.ok ? 'UP' : 'DOWN'
    } catch {
      return 'DOWN'
    }
  }

  private async checkDocumenso(): Promise<HealthStatus> {
    const baseUrl = this.envProvider.get('DOCUMENSO_URL')
    if (!baseUrl) return 'NOT_CONFIGURED'

    try {
      const result = await fetch(new URL('/api/health', baseUrl), {
        redirect: 'error',
        signal: AbortSignal.timeout(DEPENDENCY_TIMEOUT_MS),
      })
      if (!result.ok) return 'DOWN'
      const body = (await result.json()) as { status?: string }
      if (body.status === 'ok') return 'UP'
      return body.status === 'warning' ? 'DEGRADED' : 'DOWN'
    } catch {
      return 'DOWN'
    }
  }

  private async checkInngestHandler(): Promise<HealthStatus> {
    const isDev = this.envProvider.get('INNGEST_DEV') === '1'
    if (isDev) {
      return this.checkHttp(
        `http://127.0.0.1:${this.envProvider.get('HMS_SERVER_APP_PORT')}`,
        '/api/inngest',
      )
    }

    const apiKey = this.envProvider.get('INNGEST_API_KEY')
    const appUrl = this.envProvider.get('INNGEST_APP_URL')
    if (!apiKey || !appUrl) {
      return 'NOT_CONFIGURED'
    }

    try {
      const result = await fetch('https://api.inngest.com/v2/apps/hms-server', {
        headers: { Authorization: `Bearer ${apiKey}` },
        redirect: 'error',
        signal: AbortSignal.timeout(DEPENDENCY_TIMEOUT_MS),
      })
      if (!result.ok) {
        await result.body?.cancel()
        return 'DOWN'
      }

      const body = (await result.json()) as {
        data?: {
          id?: string
          isArchived?: boolean
          functionCount?: number
          latestSync?: { status?: string; url?: string }
        }
      }
      const app = body.data
      const sync = app?.latestSync
      const isSynced =
        app?.id === 'hms-server' &&
        app.isArchived === false &&
        (app.functionCount ?? 0) > 0 &&
        (sync?.status === 'success' || sync?.status === 'duplicate') &&
        sync.url === appUrl
      return isSynced ? 'UP' : 'DOWN'
    } catch {
      return 'DOWN'
    }
  }
}
