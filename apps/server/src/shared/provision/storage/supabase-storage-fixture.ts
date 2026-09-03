import { createHmac } from 'node:crypto'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import postgres from 'postgres'
import {
  GenericContainer,
  Network,
  type StartedNetwork,
  type StartedTestContainer,
  Wait,
} from 'testcontainers'

import { envSchema, type EnvProvider } from '@/shared/provision/env/env-provider'

const STORAGE_API_IMAGE = 'supabase/storage-api:v1.60.4'
const STORAGE_API_PORT = 5000
const STORAGE_BUCKET = 'documents'
const JWT_SECRET = 'inngest-storage-fixture-secret-at-least-32-characters'
const STORAGE_DATABASE_URL =
  'postgresql://postgres:postgres@storage-database:5432/storage'

export class SupabaseStorageFixture {
  private network: StartedNetwork | undefined
  private databaseContainer: StartedPostgreSqlContainer | undefined
  private storageContainer: StartedTestContainer | undefined
  private gatewayContainer: StartedTestContainer | undefined
  private gatewayUrl: string | undefined
  private serviceKey: string | undefined
  private readonly originalEnvironment = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
    SUPABASE_URL: process.env.SUPABASE_URL,
  }

  static async register() {
    const fixture = new SupabaseStorageFixture()

    try {
      await fixture.start()
      return fixture
    } catch (error) {
      await fixture.close().catch(() => undefined)
      throw error
    }
  }

  get envProvider() {
    if (!this.gatewayUrl || !this.serviceKey) {
      throw new Error('The Supabase Storage fixture has not been started.')
    }

    const values = envSchema.parse({
      ...process.env,
      SUPABASE_URL: this.gatewayUrl,
      SUPABASE_SERVICE_ROLE_KEY: this.serviceKey,
      SUPABASE_STORAGE_BUCKET: STORAGE_BUCKET,
    })

    return {
      get<Key extends keyof typeof values>(key: Key) {
        return values[key]
      },
    } as EnvProvider
  }

  async close() {
    const errors: unknown[] = []

    for (const resource of [
      this.gatewayContainer,
      this.storageContainer,
      this.databaseContainer,
      this.network,
    ]) {
      try {
        await resource?.stop()
      } catch (error) {
        errors.push(error)
      }
    }

    this.gatewayContainer = undefined
    this.storageContainer = undefined
    this.databaseContainer = undefined
    this.network = undefined
    this.gatewayUrl = undefined
    this.serviceKey = undefined
    this.restoreEnvironment()

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to stop the Supabase Storage fixture.')
    }
  }

  private async start() {
    const serviceKey = this.createServiceRoleKey()
    this.network = await new Network().start()
    this.databaseContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('storage')
      .withUsername('postgres')
      .withPassword('postgres')
      .withNetwork(this.network)
      .withNetworkAliases('storage-database')
      .start()
    await this.prepareDatabase(this.databaseContainer.getConnectionUri())
    await this.migrateDatabase(serviceKey)
    this.storageContainer = await new GenericContainer(STORAGE_API_IMAGE)
      .withNetwork(this.network)
      .withNetworkAliases('storage-api')
      .withEnvironment({
        ANON_KEY: serviceKey,
        SERVICE_KEY: serviceKey,
        PGRST_JWT_SECRET: JWT_SECRET,
        AUTH_JWT_SECRET: JWT_SECRET,
        DATABASE_URL: STORAGE_DATABASE_URL,
        POSTGREST_URL: 'http://storage-postgrest:3000',
        FILE_SIZE_LIMIT: '52428800',
        STORAGE_BACKEND: 'file',
        FILE_STORAGE_BACKEND_PATH: '/var/lib/storage',
        TENANT_ID: 'stub',
        REGION: 'sa-east-1',
        GLOBAL_S3_BUCKET: 'stub',
        ENABLE_IMAGE_TRANSFORMATION: 'false',
      })
      .withExposedPorts(STORAGE_API_PORT)
      .withWaitStrategy(Wait.forHttp('/status', STORAGE_API_PORT).forStatusCode(200))
      .withStartupTimeout(120_000)
      .start()
    this.gatewayContainer = await new GenericContainer('nginx:1.27-alpine')
      .withNetwork(this.network)
      .withExposedPorts(80)
      .withCopyContentToContainer([
        {
          target: '/etc/nginx/conf.d/default.conf',
          content: `server {
  listen 80;
  location /storage/v1/ {
    proxy_pass http://storage-api:${STORAGE_API_PORT}/;
  }
}
`,
        },
      ])
      .withWaitStrategy(Wait.forHttp('/storage/v1/status', 80).forStatusCode(200))
      .start()

    const gatewayUrl = `http://${this.gatewayContainer.getHost()}:${this.gatewayContainer.getMappedPort(80)}`
    process.env.SUPABASE_URL = gatewayUrl
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey
    process.env.SUPABASE_STORAGE_BUCKET = STORAGE_BUCKET
    this.gatewayUrl = gatewayUrl
    this.serviceKey = serviceKey

    await this.createBucket(gatewayUrl, serviceKey)
  }

  private createServiceRoleKey() {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
      'base64url',
    )
    const payload = Buffer.from(
      JSON.stringify({
        role: 'service_role',
        aud: 'authenticated',
        iss: 'hms-test',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      }),
    ).toString('base64url')
    const signature = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url')

    return `${header}.${payload}.${signature}`
  }

  private async createBucket(gatewayUrl: string, serviceKey: string) {
    const response = await fetch(`${gatewayUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ id: STORAGE_BUCKET, name: STORAGE_BUCKET, public: false }),
    })

    if (!response.ok) {
      throw new Error(
        `Failed to create the Supabase Storage test bucket: ${response.status} ${await response.text()}`,
      )
    }
  }

  private async migrateDatabase(serviceKey: string) {
    const network = this.network
    if (!network) throw new Error('The Supabase Storage network is not running.')

    let output = ''

    try {
      await new GenericContainer(STORAGE_API_IMAGE)
        .withNetwork(network)
        .withEnvironment({
          ANON_KEY: serviceKey,
          AUTH_JWT_SECRET: JWT_SECRET,
          DATABASE_URL: STORAGE_DATABASE_URL,
          DB_INSTALL_ROLES: 'true',
          PGRST_JWT_SECRET: JWT_SECRET,
          SERVICE_KEY: serviceKey,
        })
        .withCommand(['node', 'dist/scripts/migrate-call.js'])
        .withLogConsumer((stream) => {
          stream.on('data', (chunk) => {
            output += chunk.toString()
          })
        })
        .withWaitStrategy(Wait.forOneShotStartup())
        .start()
    } catch (error) {
      throw new Error(`Failed to migrate Supabase Storage: ${output.trim()}`, {
        cause: error,
      })
    }
  }

  private async prepareDatabase(connectionUri: string) {
    const database = postgres(connectionUri)

    try {
      await database.unsafe(`
        CREATE ROLE anon NOLOGIN;
        CREATE ROLE authenticated NOLOGIN;
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
        GRANT anon, authenticated, service_role TO postgres;
      `)
    } finally {
      await database.end()
    }
  }

  private restoreEnvironment() {
    for (const [key, value] of Object.entries(this.originalEnvironment)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}
