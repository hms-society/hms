export type SendEmailMessageParams = {
  to: string
  subject: string
  text?: string
  html?: string
  fileIds: string[]
  inReplyTo?: string
  references: string[]
  idempotencyKey: string
}
