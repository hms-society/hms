import {
  AggregationTemporality,
  InMemoryMetricExporter,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import type { RestFixture } from '@/shared/rest/tests/rest-fixture'

describe('Check Health Controller [GET /health]', () => {
  const originalEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  const spanNames: string[] = []
  const spanAttributes: Record<string, unknown>[] = []
  const metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE)
  const metricReader = new PeriodicExportingMetricReader({ exporter: metricExporter })
  let fixture: RestFixture | undefined
  let sdk: NodeSDK | undefined
  let isInngestDev = true

  beforeAll(async () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://127.0.0.1:4318'
    sdk = new NodeSDK({
      traceExporter: {
        export(spans, callback) {
          spanNames.push(...spans.map((span) => span.name))
          spanAttributes.push(...spans.map((span) => span.attributes))
          callback({ code: 0 })
        },
        async shutdown() {},
      },
      metricReaders: [metricReader],
      autoDetectResources: false,
    })
    sdk.start()
    // Production preloads the SDK before importing the database client.
    const [
      { SharedDatabaseModule },
      { CheckHealthController },
      { EnvProvider },
      { RestFixture },
    ] = await Promise.all([
      import('@/shared/database/drizzle/database.module.js'),
      import('@/shared/rest/controllers/check-health.controller.js'),
      import('@/shared/provision/env/env-provider.js'),
      import('@/shared/rest/tests/rest-fixture.js'),
    ])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 200 })),
    )
    fixture = await RestFixture.register({
      imports: [SharedDatabaseModule],
      controllers: [CheckHealthController],
      providers: [
        {
          provide: EnvProvider,
          useValue: {
            get(key: string) {
              if (key === 'SUPABASE_URL') return 'http://localhost:8000'
              if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'service-role-key'
              if (key === 'HMS_SERVER_APP_PORT') return 3333
              if (key === 'INNGEST_DEV') return isInngestDev ? '1' : '0'
              if (key === 'INNGEST_API_KEY') return 'test-api-key'
              if (key === 'INNGEST_APP_URL')
                return 'https://server-staging.app.hmsadvogados.com.br/api/inngest'
              return undefined
            },
          },
        },
      ],
    })
  })

  afterAll(async () => {
    try {
      await fixture?.close()
    } finally {
      try {
        await sdk?.shutdown()
      } finally {
        vi.unstubAllGlobals()
        if (originalEndpoint === undefined) {
          delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        } else {
          process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalEndpoint
        }
      }
    }
  })

  it('records the database health query without exposing its SQL', async () => {
    if (!fixture || !sdk) throw new Error('Health test infrastructure is unavailable')
    const response = await request(fixture.app.getHttpServer()).get('/health').expect(200)

    expect(response.body).toMatchObject({
      status: 'degraded',
      services: { database: 'UP', documenso: 'NOT_CONFIGURED' },
    })

    await metricReader.forceFlush()
    await sdk.shutdown()
    sdk = undefined

    expect(spanNames).toContain('postgresql SELECT')
    expect(spanNames.join(' ')).not.toContain('select 1')
    expect(spanAttributes).toContainEqual(
      expect.objectContaining({ 'db.operation.name': 'SELECT' }),
    )
    expect(JSON.stringify(spanAttributes)).not.toContain('select 1')
    const metrics = metricExporter
      .getMetrics()
      .flatMap((resource) => resource.scopeMetrics)
      .flatMap((scope) => scope.metrics)
    const duration = metrics.find(
      (metric) => metric.descriptor.name === 'db.client.operation.duration',
    )
    expect(duration?.dataPoints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attributes: expect.objectContaining({ 'db.operation.name': 'SELECT' }),
        }),
      ]),
    )
    expect(JSON.stringify(duration?.dataPoints)).not.toContain('select 1')
  })

  it('reports a stalled database without terminating the process', async () => {
    if (!fixture) throw new Error('Health test infrastructure is unavailable')
    const { DrizzleClient } = await import('@/shared/database/drizzle/drizzle-client.js')
    const drizzleClient = fixture.get(DrizzleClient)
    // A permanently stalled socket cannot be reproduced with a normal
    // PostgreSQL Testcontainer, so this failure path controls that one query.
    const healthProbe = vi
      .spyOn(drizzleClient, 'isHealthy')
      .mockImplementation(() => new Promise<boolean>(() => {}))
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    try {
      const response = await request(fixture.app.getHttpServer())
        .get('/health')
        .expect(503)
      expect(response.body).toMatchObject({
        status: 'not_ready',
        services: {
          database: 'DOWN',
          'supabase-auth': 'UP',
          inngest: 'UP',
          documenso: 'NOT_CONFIGURED',
        },
      })
      expect(exit).not.toHaveBeenCalled()
    } finally {
      healthProbe.mockRestore()
      exit.mockRestore()
    }
  }, 10_000)

  it('reports Inngest Cloud sync only when the active app has the expected URL', async () => {
    if (!fixture) throw new Error('Health test infrastructure is unavailable')
    isInngestDev = false
    const mockedFetch = vi.mocked(fetch)
    mockedFetch.mockImplementation(async (input) => {
      if (String(input) === 'https://api.inngest.com/v2/apps/hms-server') {
        return new Response(
          JSON.stringify({
            data: {
              id: 'hms-server',
              isArchived: false,
              functionCount: 16,
              latestSync: {
                status: 'success',
                url: 'https://server-staging.app.hmsadvogados.com.br/api/inngest',
              },
            },
          }),
          { status: 200 },
        )
      }
      return new Response(null, { status: 200 })
    })

    try {
      const synced = await request(fixture.app.getHttpServer()).get('/health').expect(200)
      expect(synced.body.services.inngest).toBe('UP')
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api.inngest.com/v2/apps/hms-server',
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-api-key' },
        }),
      )

      mockedFetch.mockImplementation(async (input) => {
        if (String(input) === 'https://api.inngest.com/v2/apps/hms-server') {
          return new Response(
            JSON.stringify({
              data: {
                id: 'hms-server',
                isArchived: false,
                functionCount: 16,
                latestSync: {
                  status: 'success',
                  url: 'https://wrong.example.com/api/inngest',
                },
              },
            }),
            { status: 200 },
          )
        }
        return new Response(null, { status: 200 })
      })
      const mismatched = await request(fixture.app.getHttpServer())
        .get('/health')
        .expect(200)
      expect(mismatched.body).toMatchObject({
        status: 'degraded',
        services: { inngest: 'DOWN' },
      })
    } finally {
      isInngestDev = true
      mockedFetch.mockImplementation(async () => new Response(null, { status: 200 }))
    }
  })
})
