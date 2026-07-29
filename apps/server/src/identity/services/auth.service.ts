import { Injectable, Inject, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq, sql } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../../shared/database/database.provider'
import { parametroSistema, segurancaUsuario, usuario } from '../../shared/database/schema'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class AuthService {
  private supabase: SupabaseClient

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') || 'http://127.0.0.1:8000'

    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      'local-development-service-role-key'

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    })
  }

  async autenticar(identificador: string, senha: string) {
    const [dadosUsuario] = await this.db
      .select()
      .from(usuario)
      .where(eq(usuario.email, identificador))

    if (!dadosUsuario?.ativo) {
      throw new UnauthorizedException('Email ou senha inválidos')
    }

    const [seguranca] = await this.db
      .select()
      .from(segurancaUsuario)
      .where(eq(segurancaUsuario.usuarioId, dadosUsuario.id))

    if (seguranca.bloqueadoAte && seguranca.bloqueadoAte < new Date()) {
      await this.db
        .update(segurancaUsuario)
        .set({
          tentativasFalhas: 0,
          bloqueadoAte: null,
        })
        .where(eq(segurancaUsuario.usuarioId, dadosUsuario.id))

      seguranca.tentativasFalhas = 0
      seguranca.bloqueadoAte = null
    }

    if (seguranca?.bloqueadoAte) {
      if (seguranca.bloqueadoAte > new Date()) {
        throw new UnauthorizedException(
          'Conta bloqueada, aguarde 15 minutos para novo login',
        )
      }

      await this.db
        .update(segurancaUsuario)
        .set({
          tentativasFalhas: 0,
          bloqueadoAte: null,
        })
        .where(eq(segurancaUsuario.usuarioId, dadosUsuario.id))
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dadosUsuario.email,
      password: senha,
    })

    if (error) {
      await this.tratarFalhaLogin(dadosUsuario.id, seguranca)
      return
    }

    if (!data.session) {
      throw new UnauthorizedException('sessao_nao_criada')
    }

    const sessionId = this.obterSessionId(data.session.access_token)

    await this.db
      .update(segurancaUsuario)
      .set({
        tentativasFalhas: 0,
        bloqueadoAte: null,
        sessaoAtivaId: sessionId,
      })
      .where(eq(segurancaUsuario.usuarioId, dadosUsuario.id))

    const ultimoAcesso = new Date()

    await this.db
      .update(usuario)
      .set({
        ultimoAcessoEm: ultimoAcesso,
      })
      .where(eq(usuario.id, dadosUsuario.id))

    return {
      accessToken: data.session?.access_token,
      user: dadosUsuario,
    }
  }

  private async tratarFalhaLogin(usuarioId: string, registro: any) {
    const maxTentativas = await this.obterParametro('SEGURANCA_LOGIN_MAX_TENTATIVAS')

    const minutosBloqueio = await this.obterParametro(
      'SEGURANCA_LOGIN_TEMPO_BLOQUEIO_MINUTOS',
    )

    const novasTentativas = (registro?.tentativasFalhas ?? 0) + 1

    const bloqueadoAte =
      novasTentativas >= maxTentativas
        ? new Date(Date.now() + minutosBloqueio * 60 * 1000)
        : null

    await this.db
      .insert(segurancaUsuario)
      .values({
        usuarioId,
        tentativasFalhas: novasTentativas,
        bloqueadoAte,
      })
      .onConflictDoUpdate({
        target: segurancaUsuario.usuarioId,
        set: {
          tentativasFalhas: novasTentativas,
          bloqueadoAte,
        },
      })

    throw new UnauthorizedException(
      bloqueadoAte
        ? 'Conta bloqueada, aguarde 15 minutos para novo login'
        : 'Email ou senha inválidos',
    )
  }

  private async obterParametro(chave: string): Promise<number> {
    const [param] = await this.db
      .select({
        valor: sql`${parametroSistema.valorJson}->>'valor'`,
      })
      .from(parametroSistema)
      .where(eq(parametroSistema.chave, chave))

    return Number(param?.valor) || 0
  }

  private obterSessionId(accessToken: string): string {
    const payload = JSON.parse(
      Buffer.from(accessToken.split('.')[1], 'base64').toString(),
    )

    return payload.session_id
  }
}
