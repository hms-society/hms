import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { DatabaseHealthWatchdog } from '../database-health-watchdog'

describe('DatabaseHealthWatchdog', () => {
  let watchdog: DatabaseHealthWatchdog
  let mockDrizzleClient: any
  let mockEnvProvider: any

  beforeEach(() => {
    vi.useFakeTimers()
    mockDrizzleClient = {
      isHealthy: vi.fn().mockResolvedValue(true),
    }
    mockEnvProvider = {
      get: vi.fn().mockReturnValue('production'),
    }
  })

  afterEach(() => {
    watchdog?.onModuleDestroy()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('does not schedule probes in dev mode', () => {
    mockEnvProvider.get.mockReturnValue('dev')
    watchdog = new DatabaseHealthWatchdog(mockDrizzleClient, mockEnvProvider)

    watchdog.onModuleInit()

    expect(mockDrizzleClient.isHealthy).not.toHaveBeenCalled()
  })

  it('probes database periodically in non-dev mode', async () => {
    watchdog = new DatabaseHealthWatchdog(mockDrizzleClient, mockEnvProvider)

    watchdog.onModuleInit()

    await vi.advanceTimersByTimeAsync(30_000)

    expect(mockDrizzleClient.isHealthy).toHaveBeenCalledTimes(1)
  })

  it('handles probe error gracefully without crashing', async () => {
    mockDrizzleClient.isHealthy.mockRejectedValue(new Error('Connection failed'))
    watchdog = new DatabaseHealthWatchdog(mockDrizzleClient, mockEnvProvider)

    watchdog.onModuleInit()

    await vi.advanceTimersByTimeAsync(30_000)

    expect(mockDrizzleClient.isHealthy).toHaveBeenCalled()
  })

  it('stops timer onModuleDestroy', () => {
    watchdog = new DatabaseHealthWatchdog(mockDrizzleClient, mockEnvProvider)
    watchdog.onModuleInit()
    watchdog.onModuleDestroy()

    vi.advanceTimersByTime(60_000)
    expect(mockDrizzleClient.isHealthy).not.toHaveBeenCalled()
  })
})
