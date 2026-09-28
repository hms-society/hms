import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'

import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { EnvProvider } from '@/shared/provision/env/env-provider'

const WATCHDOG_INTERVAL_MS = 30_000
const WATCHDOG_TIMEOUT_MS = 15_000
const STALLED_PROBES_BEFORE_RESTART = 2

@Injectable()
export class DatabaseHealthWatchdog implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | undefined
  private stalledProbesCount = 0
  private isStopping = false

  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly envProvider: EnvProvider,
  ) {}

  onModuleInit() {
    if (this.envProvider.get('HMS_SERVER_APP_MODE') !== 'dev') this.scheduleNextProbe()
  }

  onModuleDestroy() {
    this.isStopping = true
    if (this.timer) clearTimeout(this.timer)
  }

  private scheduleNextProbe() {
    if (this.isStopping) return
    this.timer = setTimeout(() => void this.probe(), WATCHDOG_INTERVAL_MS)
    this.timer.unref()
  }

  private async probe() {
    let timeout: NodeJS.Timeout | undefined
    try {
      const isStalled = await Promise.race([
        this.drizzleClient.isHealthy().then(
          () => false,
          () => false,
        ),
        new Promise<boolean>((resolve) => {
          timeout = setTimeout(() => resolve(true), WATCHDOG_TIMEOUT_MS)
        }),
      ])

      this.stalledProbesCount = isStalled ? this.stalledProbesCount + 1 : 0
      if (isStalled) {
        Logger.warn('Database health query stalled', DatabaseHealthWatchdog.name)
      }
      if (this.stalledProbesCount >= STALLED_PROBES_BEFORE_RESTART) {
        Logger.error('Database health queries repeatedly stalled; restarting process')
        process.exit(1)
      }
    } finally {
      if (timeout) clearTimeout(timeout)
      this.scheduleNextProbe()
    }
  }
}
