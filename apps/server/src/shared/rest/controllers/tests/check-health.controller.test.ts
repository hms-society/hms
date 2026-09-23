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
    const [{ SharedDatabaseModule }, { CheckHealthController }, { RestFixture }] =
      await Promise.all([
        import('@/shared/database/drizzle/database.module.js'),
        import('@/shared/rest/controllers/check-health.controller.js'),
        import('@/shared/rest/tests/rest-fixture.js'),
      ])
    fixture = await RestFixture.register({
      imports: [SharedDatabaseModule],
      controllers: [CheckHealthController],
    })
  })

  afterAll(async () => {
    try {
      await fixture?.close()
    } finally {
      try {
        await sdk?.shutdown()
      } finally {
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

    expect(response.body).toMatchObject({ status: 'ok', services: { database: 'UP' } })

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

  it('exits so the container can restart when the database probe stalls', async () => {
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
      await request(fixture.app.getHttpServer()).get('/health').expect(503)
      expect(exit).toHaveBeenCalledWith(1)
    } finally {
      healthProbe.mockRestore()
      exit.mockRestore()
    }
  }, 20_000)
})
