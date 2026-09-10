import { Injectable, Inject } from '@nestjs/common'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '@hms/core/shared/domain/errors'
import { EnvProvider } from '../env/env-provider'
import type { StorageProvider } from '@hms/core/shared/interfaces'

const MAX_STORAGE_DOWNLOAD_BYTES = 50 * 1024 * 1024

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
    // Ensure the bucket exists
    await this.supabase.storage
      .createBucket(this.bucketName, {
        public: false,
      })
      .catch(() => {})
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, file, {
        contentType: mimeType,
        upsert: true,
      })

    if (error) {
      throw new AppError(error.message, 'Erro no Armazenamento de Documentos')
    }

    return path
  }

  async download(path: string): Promise<Uint8Array> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(path)

    if (error || !data) {
      throw new AppError(
        error?.message ?? 'O arquivo não está disponível no armazenamento.',
        'Erro no Armazenamento de Documentos',
      )
    }

    const content = new Uint8Array(await data.arrayBuffer())
    if (content.byteLength > MAX_STORAGE_DOWNLOAD_BYTES) {
      throw new AppError(
        'O arquivo excede o limite de leitura configurado.',
        'Arquivo Muito Grande',
      )
    }

    return content
  }

  async remove(path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(this.bucketName).remove([path])

    if (error) {
      throw new AppError(error.message, 'Erro no Armazenamento de Documentos')
    }
  }
}
