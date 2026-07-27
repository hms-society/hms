import { Injectable, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../../shared/database/database.provider'
import { usuario } from '../../shared/database/schema'
import { SupabaseClient, createClient } from '@supabase/supabase-js'

@Injectable()
export class PasswordResetService {
  private supabase: SupabaseClient

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') || 'http://localhost:8000'
    const supabaseKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      'local-development-service-role-key'

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        flowType: 'implicit',
      },
    })
  }

  async solicitarRedefinicaoSenha(email: string): Promise<void> {
    const [dadosUsuario] = await this.db
      .select()
      .from(usuario)
      .where(eq(usuario.email, email))

    if (!dadosUsuario?.ativo) {
      return
    }

    await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    })
  }
}
