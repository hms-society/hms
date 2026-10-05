import { createServer, type Server } from 'node:http'

export class MetaGraphFixture {
  private readonly originalBaseUrl = process.env.META_GRAPH_API_BASE_URL
  private readonly originalAppId = process.env.META_APP_ID
  private readonly originalAppSecret = process.env.META_APP_SECRET
  readonly requests: Array<{ method?: string; path?: string; body: unknown }> = []

  private constructor(private readonly server: Server) {}

  static async register() {
    const fixture = new MetaGraphFixture(createServer())
    fixture.server.on('request', async (request, response) => {
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(Buffer.from(chunk))
      const text = Buffer.concat(chunks).toString('utf8')
      const body = text ? (JSON.parse(text) as unknown) : undefined
      fixture.requests.push({ method: request.method, path: request.url, body })
      response.setHeader('Content-Type', 'application/json')
      if (request.url?.startsWith('/v25.0/oauth/access_token')) {
        response.end(
          JSON.stringify({ access_token: 'local-meta-token', token_type: 'bearer' }),
        )
      } else if (request.url?.endsWith('/messages')) {
        response.end(JSON.stringify({ messages: [{ id: 'local-message-id' }] }))
      } else if (request.url?.startsWith('/v25.0/')) {
        response.end(
          JSON.stringify({
            display_phone_number: '+5511999998888',
            verified_name: 'Advocacia HMS',
            quality_rating: 'GREEN',
          }),
        )
      } else {
        response.writeHead(404)
        response.end('{}')
      }
    })
    await new Promise<void>((resolve) => fixture.server.listen(0, '127.0.0.1', resolve))
    const address = fixture.server.address()
    if (!address || typeof address === 'string')
      throw new Error('Meta protocol port unavailable')
    process.env.META_GRAPH_API_BASE_URL = `http://127.0.0.1:${address.port}/v25.0`
    process.env.META_APP_ID = 'local-meta-app-id'
    process.env.META_APP_SECRET = 'local-meta-app-secret'
    return fixture
  }

  async close() {
    this.server.closeAllConnections()
    await new Promise<void>((resolve) => this.server.close(() => resolve()))
    if (this.originalBaseUrl === undefined) delete process.env.META_GRAPH_API_BASE_URL
    else process.env.META_GRAPH_API_BASE_URL = this.originalBaseUrl
    if (this.originalAppId === undefined) delete process.env.META_APP_ID
    else process.env.META_APP_ID = this.originalAppId
    if (this.originalAppSecret === undefined) delete process.env.META_APP_SECRET
    else process.env.META_APP_SECRET = this.originalAppSecret
  }
}
