import { Injectable } from '@nestjs/common'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class PasswordResetService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  async solicitarRedefinicaoSenha(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  async confirmarRedefinicaoSenha(novaSenha: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: novaSenha
    })

    if (error) {
      throw new Error(error.message)
    }
  }
}