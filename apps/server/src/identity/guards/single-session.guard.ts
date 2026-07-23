import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../../shared/database/database.provider'
import { segurancaUsuario } from '../../shared/database/schema'

@Injectable()
export class SingleSessionGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user 
    const jwtSessionId = user?.sessionId

    if (!user || !jwtSessionId) {
      throw new UnauthorizedException()
    }

    const [registro] = await this.db.select({ sessaoAtivaId: segurancaUsuario.sessaoAtivaId })
      .from(segurancaUsuario)
      .where(eq(segurancaUsuario.usuarioId, user.id))

    if (registro?.sessaoAtivaId !== jwtSessionId) {
      throw new UnauthorizedException('sessao_invalidada')
    }

    return true
  }
}