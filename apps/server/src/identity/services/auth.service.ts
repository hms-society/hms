import { Injectable, Inject, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq, or, sql } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../../shared/database/database.provider'
import { parametroSistema } from '../../shared/database/schema'
import { segurancaUsuario, usuario } from '../../shared/database/schema'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class AuthService {
  private supabase: SupabaseClient

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || 'http://127.0.0.1:8000'
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || 'local-development-service-role-key'

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  }

  async autenticar(identificador: string, senha: string) {
    const [dadosUsuario] = await this.db
      .select()
      .from(usuario)
      .where((eq(usuario.email, identificador)))

    if (!dadosUsuario || !dadosUsuario.ativo) {
      throw new UnauthorizedException('credenciais_invalidas')
    }

    const [seguranca] = await this.db
      .select()
      .from(segurancaUsuario)
      .where(eq(segurancaUsuario.usuarioId, dadosUsuario.id))

    if (seguranca?.bloqueadoAte && seguranca.bloqueadoAte > new Date()) {
      throw new UnauthorizedException('conta_bloqueada')
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dadosUsuario.email,
      password: senha,
    })

    if (error) {
      await this.tratarFalhaLogin(dadosUsuario.id, seguranca)
    }

    await this.db
      .update(segurancaUsuario)
      .set({ tentativasFalhas: 0, bloqueadoAte: null })
      .where(eq(segurancaUsuario.usuarioId, dadosUsuario.id))

    return {
      accessToken: data.session?.access_token,
      user: dadosUsuario,
    }
  }

  private async tratarFalhaLogin(usuarioId: string, registro: any) {
    const maxTentativas = await this.obterParametro('SEGURANCA_LOGIN_MAX_TENTATIVAS')
    const minutosBloqueio = await this.obterParametro('SEGURANCA_LOGIN_TEMPO_BLOQUEIO_MINUTOS')

    const novasTentativas = (registro?.tentativasFalhas || 0) + 1
    let bloqueadoAte: Date | null = null

    if (novasTentativas >= maxTentativas) {
      bloqueadoAte = new Date()
      bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + minutosBloqueio)
    }

    await this.db
      .insert(segurancaUsuario)
      .values({ usuarioId, tentativasFalhas: novasTentativas, bloqueadoAte })
      .onConflictDoUpdate({
        target: segurancaUsuario.usuarioId,
        set: { tentativasFalhas: novasTentativas, bloqueadoAte },
      })

    if (bloqueadoAte) {
      throw new UnauthorizedException('conta_bloqueada')
    }

    throw new UnauthorizedException('credenciais_invalidas')
  }

  private async obterParametro(chave: string): Promise<number> {
    const [param] = await this.db
      .select({ valor: sql`${parametroSistema.valorJson}->>'valor'` })
      .from(parametroSistema)
      .where(eq(parametroSistema.chave, chave))
    return Number(param?.valor) || 0
  }
}