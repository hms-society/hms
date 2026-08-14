import { Injectable, Inject } from '@nestjs/common'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { EnvProvider } from '../env/env-provider'
import type { StorageProvider } from '@hms/core/shared/interfaces'

@Injectable()
export class SupabaseStorageProvider implements StorageProvider {
  private readonly supabase: SupabaseClient
  private readonly bucketName: string

  constructor(@Inject(EnvProvider) private readonly envProvider: EnvProvider) {
    this.supabase = createClient(
      this.envProvider.get('SUPABASE_URL'),
      this.envProvider.get('SUPABASE_SERVICE_ROLE_KEY'),
    )
    this.bucketName = this.envProvider.get('SUPABASE_STORAGE_BUCKET')
  }

  async upload(path: string, file: Uint8Array, mimeType: string): Promise<string> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      throw new Error(error.message)
    }

    return path
  }
}
