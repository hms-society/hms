import { describe, expect, it, afterEach } from 'vitest'
import { observePostgresClient } from '../observed-postgres-client'

describe('observePostgresClient', () => {
  const originalEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

  afterEach(() => {
    if (originalEndpoint === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    } else {
      process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalEndpoint
    }
  })

  it('returns plain client if OTEL_EXPORTER_OTLP_ENDPOINT is not set', () => {
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    const mockClient = { query: 'raw' } as any

    const result = observePostgresClient(mockClient)

    expect(result).toBe(mockClient)
  })

  it('proxies client when OTEL_EXPORTER_OTLP_ENDPOINT is set', () => {
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4318'

    const mockClient = {
      unsafe: () => ({ id: 1 }),
      begin: () => ({ id: 2 }),
    } as any

    const observed = observePostgresClient(mockClient)

    expect(observed).toBeDefined()
    expect(typeof observed.unsafe).toBe('function')
    expect(typeof observed.begin).toBe('function')
  })
})
