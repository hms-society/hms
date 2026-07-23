import { Inject, Injectable } from '@nestjs/common'
import * as crypto from 'crypto'
import { DRIZZLE, type DrizzleDB } from '../database.provider'
import { usuario } from '../schema'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable()
export class usuarioSeed {
  private supabase: SupabaseClient

  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:8000'
    const localJwtSecret = 
      process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long'
    const serviceRoleJwt = this.generateLocalServiceRoleJwt(localJwtSecret)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || serviceRoleJwt

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })
  }

  private generateLocalServiceRoleJwt(secret: string): string {
    const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' })
    const payload = JSON.stringify({ 
      role: 'service_role', 
      iss: 'supabase', 
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 
    })

    const base64UrlEncode = (str: string) => 
      Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const encodedHeader = base64UrlEncode(header)
    const encodedPayload = base64UrlEncode(payload)

    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  async run() {
    const email = 'admin@hmsadvogados.com.br'
    const senha = 'password123'

    // Busca usuários existentes no Supabase Auth para evitar conflitos de ID e senha
    const { data: listData, error: listError } = await this.supabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(listError.message)
    }

    let userId: string | undefined = listData.users.find(u => u.email === email)?.id

    if (userId) {
      // Se o usuário já existe, garante a atualização da senha e confirmação do e-mail
      await this.supabase.auth.admin.updateUserById(userId, {
        password: senha,
        email_confirm: true,
      })
    } else {
      // Se não existe, cria a conta normalmente
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      userId = authData.user?.id
    }

    if (!userId) {
      throw new Error('Não foi possível recuperar o ID do usuário no Supabase Auth.')
    }

    await this.db.insert(usuario).values([
      {
        id: userId,
        nome: 'Administrador HMS',
        email,
        senhaHash: '$2b$10$PlaceholderHashForTestingPurposesOnly',
        perfilTecnicoId: 'b0000000-0000-0000-0000-000000000001',
        tipo: 'interno',
        ativo: true,
        criadoPor: userId,
      },
    ]).onConflictDoUpdate({
      target: usuario.email,
      set: {
        id: userId,
        ativo: true,
      },
    })
  }
}