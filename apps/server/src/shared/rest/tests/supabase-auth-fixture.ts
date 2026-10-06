import { createHmac, randomUUID } from 'node:crypto'
import { createServer, request as httpRequest, type Server } from 'node:http'

import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'
import { ConfigService } from '@nestjs/config'
import type { TestingModuleBuilder } from '@nestjs/testing'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import postgres from 'postgres'
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers'

import { EnvProvider } from '@/shared/provision/env/env-provider'

const JWT_SECRET = 'test-only-supabase-jwt-secret-with-at-least-32-characters'

function serviceRoleKey() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url',
  )
  const payload = Buffer.from(
    JSON.stringify({
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      iss: 'supabase',
      role: 'service_role',
    }),
  ).toString('base64url')
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url')
  return `${header}.${payload}.${signature}`
}

export class SupabaseAuthFixture {
  private readonly createdUserIds: string[] = []
  private readonly originalUrl = process.env.SUPABASE_URL
  private readonly originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  private constructor(
    private readonly database: StartedPostgreSqlContainer | undefined,
    private readonly auth: StartedTestContainer | undefined,
    private readonly mailpit: StartedTestContainer | undefined,
    private readonly proxy: Server | undefined,
    private readonly client: SupabaseClient,
    private readonly getAuthLogs: () => string,
  ) {}

  static async register(options: { dedicated?: boolean } = {}) {
    const sharedUrl = process.env.HMS_TEST_AUTH_URL
    const sharedKey = process.env.HMS_TEST_AUTH_KEY
    if (!options.dedicated && sharedUrl && sharedKey) {
      const client = createClient(sharedUrl, sharedKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const fixture = new SupabaseAuthFixture(
        undefined,
        undefined,
        undefined,
        undefined,
        client,
        () => '',
      )
      process.env.SUPABASE_URL = sharedUrl
      process.env.SUPABASE_SERVICE_ROLE_KEY = sharedKey
      return fixture
    }
    const database = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('hms_auth_test')
      .withUsername('postgres')
      .withPassword('postgres')
      .start()
    let proxy: Server | undefined
    let auth: StartedTestContainer | undefined
    let mailpit: StartedTestContainer | undefined
    let authLogs = ''

    try {
      const databaseClient = postgres(database.getConnectionUri())
      try {
        await databaseClient`CREATE SCHEMA IF NOT EXISTS auth`
        await databaseClient`ALTER ROLE postgres SET search_path TO auth, public`
      } finally {
        await databaseClient.end()
      }

      let authUrl = ''
      proxy = createServer((incoming, outgoing) => {
        const path = incoming.url?.replace(/^\/auth\/v1/, '') ?? '/'
        const headers = Object.fromEntries(
          Object.entries(incoming.headers).filter(([name]) => name !== 'host'),
        )
        const upstream = httpRequest(
          `${authUrl}${path}`,
          { method: incoming.method, headers },
          (response) => {
            outgoing.writeHead(response.statusCode ?? 502, response.headers)
            response.pipe(outgoing)
          },
        )
        upstream.on('error', (error) => {
          outgoing.writeHead(502)
          outgoing.end(error.message)
        })
        incoming.pipe(upstream)
      })
      await new Promise<void>((resolve) => proxy?.listen(0, '127.0.0.1', resolve))
      const address = proxy.address()
      if (!address || typeof address === 'string')
        throw new Error('Auth proxy port unavailable')
      const url = `http://127.0.0.1:${address.port}`
      const key = serviceRoleKey()

      mailpit = await new GenericContainer('axllent/mailpit:v1.21')
        .withExposedPorts(1025, 8025)
        .withWaitStrategy(Wait.forHttp('/api/v1/info', 8025))
        .start()

      auth = await new GenericContainer('supabase/gotrue:v2.189.0')
        .withLogConsumer((stream) =>
          stream.on('data', (chunk) => {
            authLogs += chunk.toString()
          }),
        )
        .withEnvironment({
          GOTRUE_API_HOST: '0.0.0.0',
          GOTRUE_API_PORT: '9999',
          API_EXTERNAL_URL: `${url}/auth/v1`,
          GOTRUE_DB_DRIVER: 'postgres',
          GOTRUE_DB_DATABASE_URL: `postgres://postgres:postgres@host.docker.internal:${database.getMappedPort(5432)}/hms_auth_test?sslmode=disable`,
          GOTRUE_SITE_URL: url,
          GOTRUE_URI_ALLOW_LIST: '*',
          GOTRUE_DISABLE_SIGNUP: 'false',
          GOTRUE_JWT_ADMIN_ROLES: 'service_role',
          GOTRUE_JWT_AUD: 'authenticated',
          GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated',
          GOTRUE_JWT_EXP: '3600',
          GOTRUE_JWT_SECRET: JWT_SECRET,
          GOTRUE_EXTERNAL_EMAIL_ENABLED: 'true',
          GOTRUE_MAILER_AUTOCONFIRM: 'true',
          GOTRUE_SMTP_HOST: 'host.docker.internal',
          GOTRUE_SMTP_PORT: String(mailpit.getMappedPort(1025)),
          GOTRUE_SMTP_ADMIN_EMAIL: 'admin@hms.local',
          GOTRUE_SMTP_SENDER_NAME: 'HMS Tests',
        })
        .withExtraHosts([{ host: 'host.docker.internal', ipAddress: 'host-gateway' }])
        .withExposedPorts(9999)
        .withWaitStrategy(Wait.forHttp('/health', 9999))
        .start()
      authUrl = `http://${auth.getHost()}:${auth.getMappedPort(9999)}`
      const health = await fetch(`${url}/auth/v1/health`)
      if (!health.ok) throw new Error(`Auth proxy health failed: ${health.status}`)
      const client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const fixture = new SupabaseAuthFixture(
        database,
        auth,
        mailpit,
        proxy,
        client,
        () => authLogs,
      )
      process.env.SUPABASE_URL = url
      process.env.SUPABASE_SERVICE_ROLE_KEY = key
      return fixture
    } catch (error) {
      await auth?.stop()
      await mailpit?.stop()
      await new Promise<void>((resolve) => proxy?.close(() => resolve()) ?? resolve())
      await database.stop()
      throw new Error(
        `Supabase Auth fixture failed: ${String(error)}; logs: ${authLogs.slice(-4000)}`,
      )
    }
  }

  getServiceConfiguration() {
    if (!this.mailpit) throw new Error('Dedicated Auth service is not running')
    return {
      url: process.env.SUPABASE_URL as string,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      mailpitUrl: `http://${this.mailpit.getHost()}:${this.mailpit.getMappedPort(8025)}`,
    }
  }

  async createSignedInUser(email = `${randomUUID()}@example.com`, id?: string) {
    const password = `Test-${randomUUID()}`
    const created = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      ...(id ? { id } : {}),
    })
    if (created.error || !created.data.user)
      throw new Error(
        `Auth user creation failed: ${String(created.error)}; status: ${created.error?.status}; logs: ${this.getAuthLogs().slice(-1600)}`,
      )
    this.createdUserIds.push(created.data.user.id)
    const signedIn = await this.client.auth.signInWithPassword({ email, password })
    if (signedIn.error || !signedIn.data.session)
      throw signedIn.error ?? new Error('Auth session missing')
    const checked = await this.client.auth.getUser(signedIn.data.session.access_token)
    if (checked.error || !checked.data.user)
      throw new Error(`Auth session verification failed: ${checked.error?.message}`)
    return {
      user: created.data.user,
      accessToken: signedIn.data.session.access_token,
      password,
    }
  }

  configure(builder: TestingModuleBuilder) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    const metaGraphUrl = process.env.META_GRAPH_API_BASE_URL
    const metaAppId = process.env.META_APP_ID
    const metaAppSecret = process.env.META_APP_SECRET
    // biome-ignore lint/correctness/useHookAtTopLevel: Nest testing builder APIs are not React hooks.
    return builder.overrideProvider(EnvProvider).useFactory({
      inject: [ConfigService],
      factory: (config: ConfigService) => ({
        get: (name: string) =>
          name === 'SUPABASE_URL'
            ? url
            : name === 'SUPABASE_SERVICE_ROLE_KEY'
              ? key
              : name === 'META_GRAPH_API_BASE_URL' && metaGraphUrl
                ? metaGraphUrl
                : name === 'META_APP_ID' && metaAppId
                  ? metaAppId
                  : name === 'META_APP_SECRET' && metaAppSecret
                    ? metaAppSecret
                    : config.get(name),
      }),
    })
  }

  async close() {
    try {
      if (!this.auth) {
        for (const id of this.createdUserIds) {
          const { error } = await this.client.auth.admin.deleteUser(id)
          if (error) throw error
        }
      }
      await this.auth?.stop()
      await this.mailpit?.stop()
      const proxy = this.proxy
      if (proxy) {
        proxy.closeAllConnections()
        await new Promise<void>((resolve) => proxy.close(() => resolve()))
      }
      await this.database?.stop()
    } finally {
      if (this.originalUrl === undefined) delete process.env.SUPABASE_URL
      else process.env.SUPABASE_URL = this.originalUrl
      if (this.originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
      else process.env.SUPABASE_SERVICE_ROLE_KEY = this.originalKey
    }
  }
}
