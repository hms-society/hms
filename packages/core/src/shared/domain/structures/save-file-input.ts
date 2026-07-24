export type SaveFileInput = {
  readonly filePath: string
  readonly fileName: string
  readonly contentType: string
  readonly sizeInBytes: number
  readonly content: Uint8Array
}
