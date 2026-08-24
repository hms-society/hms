import type { Entity } from './entity'

export type File = Entity & {
  filePath: string
  fileName: string
  contentType: string
  sizeInBytes: number
  createdAt: Date
}
