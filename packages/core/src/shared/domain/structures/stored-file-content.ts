import type { File } from '../entities'

export type StoredFileContent = {
  readonly file: File
  readonly content: Uint8Array
}
