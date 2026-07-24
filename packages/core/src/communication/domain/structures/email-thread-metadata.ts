export type EmailThreadMetadata = {
  readonly subject: string
  readonly externalThreadId?: string
  readonly inReplyTo?: string
  readonly references: readonly string[]
}
