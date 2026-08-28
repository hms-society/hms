import type { File } from '../domain/entities'

export interface StoredFilesRepository {
  add(file: File): Promise<File>
  findById(fileId: string): Promise<File | null>
  remove(fileId: string): Promise<void>
}
