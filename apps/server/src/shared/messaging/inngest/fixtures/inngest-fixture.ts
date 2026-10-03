import { createServer } from 'node:net'

import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Inngest, type InngestFunction } from 'inngest'
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers'

import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { InngestModule } from '@/shared/messaging/inngest/inngest.module'

async function reservePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, '0.0.0.0', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Port unavailable')
  await new Promise<void>((resolve) => server.close(() => resolve()))
  return address.port
}

type Options = {
  createFunctions: (client: InngestClient) => InngestFunction.Like[]
}

export class InngestFixture {
  private constructor(
    readonly client: Inngest,
    private readonly app: INestApplication,
    private readonly container: StartedTestContainer,
  ) {}

  static async register(options: Options) {
    let app: INestApplication | undefined
    let container: StartedTestContainer | undefined

    try {
      const appPort = await reservePort()
      const inngestPort = await reservePort()
      const client = new Inngest({
        id: 'hms-server',
        isDev: true,
        baseUrl: `http://127.0.0.1:${inngestPort}`,
      })
      const functions = options.createFunctions(client as InngestClient)
      // biome-ignore lint/correctness/useHookAtTopLevel: Nest provider registration is not a React hook.
      const endpoint = await Test.createTestingModule({
        imports: [
          InngestModule.forRoot({
            client,
            functions,
            serveOrigin: `http://host.docker.internal:${appPort}`,
            servePath: '/api/inngest',
          }),
        ],
      })
        .overrideProvider(InngestClient)
        .useValue(client)
        .compile()
      app = endpoint.createNestApplication()
      await app.listen(appPort, '0.0.0.0')
      container = await new GenericContainer('inngest/inngest:v1.36.0')
        .withCommand([
          'inngest',
          'dev',
          '--no-discovery',
          '-u',
          `http://host.docker.internal:${appPort}/api/inngest`,
        ])
        .withExtraHosts([{ host: 'host.docker.internal', ipAddress: 'host-gateway' }])
        .withExposedPorts({ container: 8288, host: inngestPort })
        .withWaitStrategy(Wait.forHttp('/health', 8288))
        .start()
      const syncResponse = await fetch(`http://127.0.0.1:${appPort}/api/inngest`, {
        method: 'PUT',
      })
      if (!syncResponse.ok) {
        throw new Error(`Inngest registration failed: ${syncResponse.status}`)
      }

      return new InngestFixture(client, app, container)
    } catch (error) {
      await app?.close()
      await container?.stop()
      throw error
    }
  }

  async close() {
    try {
      await this.app.close()
    } finally {
      await this.container.stop()
    }
  }
}
