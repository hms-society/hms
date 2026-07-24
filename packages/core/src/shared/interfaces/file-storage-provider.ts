import type { File } from '../domain/entities'
import type { SaveFileInput } from '../domain/structures'

export interface FileStorageProvider {
  save(input: SaveFileInput): Promise<File>
  remove(filePath: string): Promise<void>
}
