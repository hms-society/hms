export type EmailThreadMetadata = {
  subject: string
  externalThreadId?: string
  inReplyTo?: string
  references: string[]
}
