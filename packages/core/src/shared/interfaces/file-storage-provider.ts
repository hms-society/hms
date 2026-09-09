import type { File } from '../domain/entities'
import type { SaveFileInput } from '../domain/structures'
import type { StoredFileContent } from '../domain/structures/stored-file-content'

export interface FileStorageProvider {
  save(input: SaveFileInput): Promise<File>
  get(fileId: string): Promise<StoredFileContent | null>
  remove(fileId: string): Promise<void>
}
