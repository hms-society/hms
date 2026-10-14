export type FileContent = {
  readonly content: Uint8Array
  readonly mimeType: string
  readonly fileName?: string
}
