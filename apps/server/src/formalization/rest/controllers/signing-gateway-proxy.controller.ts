import { All, Controller, Inject, Param, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import type {
  FormalizationSignatureProxyBindingsRepository,
  SensitivePayloadCipherProvider,
  SignatureSecretHasher,
} from '@hms/core/formalization/interfaces'

import { FORMALIZATION_PROVIDERS } from '@/formalization/constants/formalization-providers'
import { FORMALIZATION_REPOSITORIES } from '@/formalization/constants/formalization-repositories'
import { EnvProvider } from '@/shared/provision/env/env-provider'
import { FormalizationSigningGatewayService } from '@/formalization/formalization-signature-sending.service'

const hopByHopHeaders = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'authorization',
  'cookie',
])
const DOCUMENSO_PT_BR_LOCALE_COOKIE = 'lang=InB0LUJSIg=='
const DOCUMENSO_SHARE_BUTTON_SELECTOR = 'button:has(svg.lucide-sparkles)'

@Controller('assinaturas/provedor')
export class SigningGatewayProxyController {
  constructor(
    @Inject(FORMALIZATION_REPOSITORIES.signatureProxyBindings)
    private readonly bindings: FormalizationSignatureProxyBindingsRepository,
    @Inject(FORMALIZATION_PROVIDERS.signatureSecretHasher)
    private readonly hasher: SignatureSecretHasher,
    @Inject(FORMALIZATION_PROVIDERS.sensitivePayloadCipher)
    private readonly cipher: SensitivePayloadCipherProvider,
    private readonly env: EnvProvider,
    private readonly gateway: FormalizationSigningGatewayService,
  ) {}

  @All(':alias')
  async handleAlias(
    @Param('alias') alias: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    return this.forward(alias, request, response)
  }

  @All(':alias/{*path}')
  async handlePath(
    @Param('alias') alias: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    return this.forward(alias, request, response)
  }

  private async forward(alias: string, request: Request, response: Response) {
    const binding = await this.bindings.findByAliasHash(this.hasher.hash(alias))
    const proxyTarget = this.proxyTarget(request, alias)
    if (!proxyTarget || !this.isSafeProxyPath(proxyTarget.pathname)) {
      response.status(400).send('Signing Gateway request rejected.')
      return
    }
    const isUnexpired = binding?.expiresAt !== undefined && binding.expiresAt > new Date()
    const canReadSubmittedCompletion =
      binding?.status === 'revoked' &&
      binding.revocationReason === 'submitted' &&
      ['GET', 'HEAD'].includes(request.method) &&
      this.isCompletionRoute(proxyTarget.pathname)
    if (
      !binding ||
      !isUnexpired ||
      (binding.status !== 'active' && !canReadSubmittedCompletion)
    ) {
      response.status(404).send('Signing Gateway resource unavailable.')
      return
    }
    const credential = await this.cipher.decrypt({
      ciphertext: binding.encryptedProviderCredential,
      keyId: binding.cipherKeyId,
      purpose: 'provider_credential',
      contextId: binding.recipientId,
    })
    const providerToken = new TextDecoder().decode(credential)
    const upstream = `${this.env.get('DOCUMENSO_PRIVATE_BASE_URL').replace(/\/$/, '')}${this.upstreamPath(proxyTarget.pathname, providerToken, alias)}${this.upstreamSearch(proxyTarget.search, providerToken, alias)}`
    const headers = new Headers()
    for (const [name, value] of Object.entries(request.headers)) {
      if (hopByHopHeaders.has(name.toLowerCase()) || typeof value !== 'string') continue
      headers.set(name, value)
    }
    headers.set('cookie', DOCUMENSO_PT_BR_LOCALE_COOKIE)
    const body = ['GET', 'HEAD'].includes(request.method)
      ? undefined
      : this.requestBody(request, providerToken, alias)
    const upstreamResponse = await fetch(upstream, {
      method: request.method,
      headers,
      body,
    })
    if (
      upstreamResponse.ok &&
      this.isCompletionMutation(request.method, proxyTarget.pathname)
    ) {
      await this.gateway.recordProviderSubmission(binding.aliasHash)
    }
    const contentType =
      upstreamResponse.headers.get('content-type') ?? 'application/octet-stream'
    response.status(upstreamResponse.status)
    response.setHeader('Cache-Control', 'no-store')
    const contentSecurityPolicy = upstreamResponse.headers.get('content-security-policy')
    response.setHeader(
      'Content-Security-Policy',
      this.rewriteContentSecurityPolicy(contentSecurityPolicy),
    )
    const location = upstreamResponse.headers.get('location')
    if (location)
      response.setHeader('Location', this.rewrite(location, providerToken, alias))
    if (
      contentType.includes('text') ||
      contentType.includes('json') ||
      contentType.includes('javascript')
    ) {
      const text = await upstreamResponse.text()
      const rewrittenText = this.rewrite(text, providerToken, alias)
      const responseText = contentType.includes('html')
        ? this.injectCompletionShareSuppression(
            rewrittenText,
            proxyTarget.pathname,
            contentSecurityPolicy,
          )
        : rewrittenText
      response.type(contentType).send(responseText)
      return
    }
    response.type(contentType).send(Buffer.from(await upstreamResponse.arrayBuffer()))
  }

  private proxyTarget(request: Request, alias: string) {
    let incoming: URL
    try {
      incoming = new URL(
        request.originalUrl || request.url,
        'http://signing-gateway.local',
      )
    } catch {
      return undefined
    }
    const proxyPrefix = this.env.get('HMS_SIGNING_PROXY_PUBLIC_PREFIX').replace(/\/$/, '')
    const aliasPrefix = `${proxyPrefix}/${encodeURIComponent(alias)}`
    if (
      incoming.pathname !== aliasPrefix &&
      !incoming.pathname.startsWith(`${aliasPrefix}/`)
    )
      return undefined
    const remainder = incoming.pathname.slice(aliasPrefix.length)
    const signerPath = `/sign/${encodeURIComponent(alias)}`
    const pathname =
      remainder === signerPath
        ? ''
        : remainder.startsWith(`${signerPath}/`)
          ? remainder.slice(signerPath.length)
          : remainder
    return {
      pathname,
      search: incoming.search,
    }
  }

  private upstreamPath(restPath: string, providerToken: string, alias: string) {
    if (this.isRootResource(restPath))
      return restPath.replaceAll(
        encodeURIComponent(alias),
        encodeURIComponent(providerToken),
      )
    return `/sign/${encodeURIComponent(providerToken)}${restPath}`
  }

  private isRootResource(restPath: string) {
    return (
      restPath === '/assets' ||
      restPath.startsWith('/assets/') ||
      restPath === '/api' ||
      restPath.startsWith('/api/') ||
      restPath === '/fonts' ||
      restPath.startsWith('/fonts/') ||
      restPath === '/__manifest' ||
      /^\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}(?:\/|$)/i.test(restPath)
    )
  }

  private upstreamSearch(search: string, providerToken: string, alias: string) {
    if (!search) return ''
    const proxyPrefix = this.env.get('HMS_SIGNING_PROXY_PUBLIC_PREFIX').replace(/\/$/, '')
    const publicPath = `${proxyPrefix}/${alias}`
    const publicSignerPath = `${publicPath}/sign/${alias}`
    const providerPath = `/sign/${providerToken}`
    const parameters = new URLSearchParams(search)
    const discoveredPaths = parameters.get('paths')
    if (discoveredPaths !== null) {
      const providerPaths = discoveredPaths
        .split(',')
        .filter((path) => path === publicPath || path.startsWith(`${publicPath}/`))
        .map((path) => `${providerPath}${path.slice(publicPath.length)}`)
      parameters.set('paths', providerPaths.join(','))
    }
    const normalizedSearch = `?${parameters.toString()}`
    return normalizedSearch
      .replaceAll(encodeURIComponent(publicSignerPath), encodeURIComponent(providerPath))
      .replaceAll(publicSignerPath, providerPath)
      .replaceAll(encodeURIComponent(publicPath), encodeURIComponent(providerPath))
      .replaceAll(publicPath, providerPath)
      .replaceAll(encodeURIComponent(alias), encodeURIComponent(providerToken))
  }

  private isSafeProxyPath(restPath: string) {
    if (restPath === '') return true
    if (!restPath.startsWith('/') || restPath.includes('\0') || restPath.includes('\\'))
      return false
    let decodedPath = restPath
    try {
      decodedPath = decodeURIComponent(restPath)
    } catch {
      return false
    }
    return (
      !decodedPath.split('/').some((segment) => segment === '.' || segment === '..') &&
      !decodedPath.startsWith('//') &&
      !decodedPath
        .split('')
        .some(
          (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        )
    )
  }

  private requestBody(request: Request, providerToken: string, alias: string) {
    if (typeof request.body === 'string')
      return request.body.replaceAll(alias, providerToken)
    if (request.body === undefined) return undefined
    return JSON.stringify(request.body).replaceAll(alias, providerToken)
  }

  private rewrite(value: string, providerToken: string, alias: string) {
    const proxyPrefix = this.env.get('HMS_SIGNING_PROXY_PUBLIC_PREFIX').replace(/\/$/, '')
    const aliasPrefix = `${proxyPrefix}/${alias}`
    const publicOrigin = this.env.get('HMS_WEB_APP_URL').replace(/\/$/, '')
    return value
      .replaceAll(providerToken, alias)
      .replaceAll('/sign/', `${aliasPrefix}/sign/`)
      .replaceAll(
        this.env.get('DOCUMENSO_PRIVATE_BASE_URL'),
        `${publicOrigin}${aliasPrefix}`,
      )
      .replace('"basename":"/"', `"basename":"${aliasPrefix}"`)
      .replace(/("NEXT_PUBLIC_BASE_PATH":)"[^"]*"/g, `$1"${aliasPrefix}"`)
      .replace(/("NEXT_PUBLIC_WEBAPP_URL":)"[^"]*"/g, `$1"${publicOrigin}${aliasPrefix}"`)
      .replace(/return(["'])\/\1\+/g, `return$1${aliasPrefix}/$1+`)
      .replace(
        /(^|[\s"'(])\/(assets|api|fonts|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})(?=\/|[?#\s"')]|$)/gi,
        `$1${aliasPrefix}/$2`,
      )
  }

  private rewriteContentSecurityPolicy(value: string | null) {
    const directives = (value ?? "default-src 'self'")
      .split(';')
      .map((directive) => directive.trim())
      .filter(
        (directive) =>
          directive && !/^(frame-ancestors|form-action)(?:\s|$)/i.test(directive),
      )
    return [...directives, "frame-ancestors 'none'", "form-action 'self'"].join('; ')
  }

  private injectCompletionShareSuppression(
    value: string,
    pathname: string,
    contentSecurityPolicy: string | null,
  ) {
    if (!this.isCompletionRoute(pathname)) return value

    const styleNonce = this.getStyleNonce(contentSecurityPolicy)
    const headMatch = value.match(/<head(?:\s[^>]*)?>/i)
    const headEndMatch = value.match(/<\/head\s*>/i)
    if (
      !styleNonce ||
      !headMatch ||
      headMatch.index === undefined ||
      !headEndMatch ||
      headEndMatch.index === undefined ||
      headEndMatch.index <= headMatch.index + headMatch[0].length
    )
      return value

    const style = `<style nonce="${styleNonce}">${DOCUMENSO_SHARE_BUTTON_SELECTOR}{display:none!important}</style>`
    return `${value.slice(0, headEndMatch.index)}${style}${value.slice(headEndMatch.index)}`
  }

  private isCompletionRoute(pathname: string) {
    return pathname === '/complete'
  }

  private isCompletionMutation(method: string, pathname: string) {
    return (
      method === 'POST' && pathname === '/api/trpc/recipient.completeDocumentWithToken'
    )
  }

  private getStyleNonce(contentSecurityPolicy: string | null) {
    const styleDirective = contentSecurityPolicy
      ?.split(';')
      .map((directive) => directive.trim())
      .find((directive) => /^style-src(?:\s|$)/i.test(directive))
    const nonce = styleDirective?.match(/(?:^|\s)'nonce-([^']+)'(?:\s|$)/i)?.[1]
    if (!nonce || nonce.length > 128 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(nonce))
      return undefined
    return nonce
  }
}
