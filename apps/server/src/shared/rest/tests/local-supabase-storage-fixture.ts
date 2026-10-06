import { createServer, type IncomingMessage, type Server } from 'node:http'

import { ConfigService } from '@nestjs/config'
import type { TestingModuleBuilder } from '@nestjs/testing'

import { EnvProvider } from '@/shared/provision/env/env-provider'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import { SupabaseStorageProvider } from '@/shared/provision/storage/supabase-storage-provider'

type StoredObject = { body: Buffer; contentType: string }

export class LocalSupabaseStorageFixture {
  private readonly objects = new Map<string, StoredObject>()
  private constructor(
    private readonly server: Server,
    private readonly url: string,
  ) {}

  static async start() {
    let fixture: LocalSupabaseStorageFixture
    const server = createServer((request, response) => {
      void fixture.handle(request, response).catch((error: unknown) => {
        fixture.sendJson(response, 500, {
          message: error instanceof Error ? error.message : 'Storage fixture failed',
        })
      })
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string')
      throw new Error('Storage fixture port unavailable')
    fixture = new LocalSupabaseStorageFixture(server, `http://127.0.0.1:${address.port}`)
    return fixture
  }

  configure(builder: TestingModuleBuilder) {
    // biome-ignore lint/correctness/useHookAtTopLevel: Nest testing builder APIs are not React hooks.
    return builder.overrideProvider(STORAGE_PROVIDER).useFactory({
      inject: [ConfigService],
      factory: (config: ConfigService) =>
        new SupabaseStorageProvider({
          get: (name: string) =>
            name === 'SUPABASE_URL'
              ? this.url
              : name === 'SUPABASE_SERVICE_ROLE_KEY'
                ? 'local-storage-service-role-key'
                : config.get(name),
        } as EnvProvider),
    })
  }

  async close() {
    await new Promise<void>((resolve, reject) =>
      this.server.close((error) => (error ? reject(error) : resolve())),
    )
  }

  private async handle(
    request: IncomingMessage,
    response: import('node:http').ServerResponse,
  ) {
    const url = new URL(request.url ?? '/', this.url)
    const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
    const method = request.method ?? 'GET'

    if (method === 'POST' && url.pathname === '/storage/v1/bucket') {
      this.sendJson(response, 200, {
        name: 'hms-bucket',
        id: 'hms-bucket',
        public: false,
      })
      return
    }

    if (segments[0] !== 'storage' || segments[1] !== 'v1' || segments[2] !== 'object') {
      this.sendJson(response, 404, { message: 'Storage route not found' })
      return
    }

    const bucket = segments[3]
    if (!bucket) {
      this.sendJson(response, 400, { message: 'Bucket is required' })
      return
    }
    const key = segments.slice(4).join('/')

    if (method === 'POST' && key) {
      const body = await this.readBody(request)
      this.objects.set(`${bucket}/${key}`, {
        body,
        contentType: request.headers['content-type'] ?? 'application/octet-stream',
      })
      this.sendJson(response, 200, { Key: `${bucket}/${key}` })
      return
    }

    if (method === 'GET' && key) {
      const stored = this.objects.get(`${bucket}/${key}`)
      if (!stored) {
        this.sendJson(response, 404, { message: 'Object not found' })
        return
      }
      response.writeHead(200, { 'content-type': stored.contentType })
      response.end(stored.body)
      return
    }

    if (method === 'DELETE' && !key) {
      const body = await this.readBody(request)
      const payload = body.length
        ? (JSON.parse(body.toString()) as { prefixes?: string[] })
        : {}
      for (const prefix of payload.prefixes ?? [])
        this.objects.delete(`${bucket}/${prefix}`)
      this.sendJson(response, 200, [])
      return
    }

    this.sendJson(response, 404, { message: 'Storage route not found' })
  }

  private readBody(request: IncomingMessage) {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      request.on('data', (chunk: Buffer) => chunks.push(chunk))
      request.on('end', () => resolve(Buffer.concat(chunks)))
      request.on('error', reject)
    })
  }

  private sendJson(
    response: import('node:http').ServerResponse,
    status: number,
    value: unknown,
  ) {
    response.writeHead(status, { 'content-type': 'application/json' })
    response.end(JSON.stringify(value))
  }
}
