import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import {DRIZZLE, type DrizzleDB} from '../../shared/database/database.provider'
import { usuario, parametroSistema } from "src/shared/database/schema";

@Injectable()
export class inactivitySessionGuard implements CanActivate{
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB){}

    async canActivate(context: ExecutionContext): Promise<boolean>{
        const request = context.switchToHttp().getRequest()
        const user = request.user

        if(!user.sub){
            throw new UnauthorizedException('usuario_nao_identificado')
        }

        const userId = user.sub

        const [dadosUsuario] = await this.db.select({ultimoAcessoEm: usuario.ultimoAcessoEm})
        .from(usuario)
        .where(eq(usuario.id, userId))

        if(!dadosUsuario){
            throw new UnauthorizedException('usuario_nao_encontrado')
        }

        const [parametro] = await this.db.select({valor: sql`${parametroSistema.valorJson}->>'valor'`})
        .from(parametroSistema)
        .where(eq(parametroSistema.chave, 'SEGURANCA_SESSAO_TEMPO_INATIVIDADE_MINUTOS'))

        const minutos = Number(parametro.valor) 

        if(dadosUsuario.ultimoAcessoEm){
            const limite = dadosUsuario.ultimoAcessoEm.getTime() + minutos * 60 * 1000

            if(Date.now() > limite){
                throw new UnauthorizedException('sessao_expirada')
            }
        }

        await this.db.update(usuario).set({ultimoAcessoEm: new Date()}).where(eq(usuario.id, userId))

        return true
    }
}


