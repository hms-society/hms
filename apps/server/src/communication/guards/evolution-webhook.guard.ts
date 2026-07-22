import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { Request } from 'express'

@Injectable()
export class EvolutionWebhookGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    const apiKeyHeader =
      (request.headers.apikey as string | undefined) ||
      (request.headers['x-api-key'] as string | undefined)

    const expectedApiKey =
      this.configService.get<string>('EVOLUTION_API_KEY') || 'change-me-evolution-api-key'

    if (!apiKeyHeader || apiKeyHeader !== expectedApiKey) {
      throw new UnauthorizedException('Chave de API da Evolution API inválida ou ausente.')
    }

    return true
  }
}
