import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../../shared/database/database.provider'
import { segurancaUsuario } from '../../shared/database/schema'

@Injectable()
export class SingleSessionGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('token_ausente')
    }

    const token = authHeader.split(' ')[1]

    let payload: any
    try {
      payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    } catch (_e) {
      throw new UnauthorizedException('token_invalido')
    }

    const userId = payload.sub
    const jwtSessionId = payload.session_id

    if (!userId || !jwtSessionId) {
      throw new UnauthorizedException('payload_incompleto')
    }

    request.user = payload

    const [registro] = await this.db
      .select({ sessaoAtivaId: segurancaUsuario.sessaoAtivaId })
      .from(segurancaUsuario)
      .where(eq(segurancaUsuario.usuarioId, userId))

    if (registro?.sessaoAtivaId !== jwtSessionId) {
      throw new UnauthorizedException('sessao_invalidada')
    }

    return true
  }
}
