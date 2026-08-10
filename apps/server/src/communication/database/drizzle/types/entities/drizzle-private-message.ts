import type { InferSelectModel } from 'drizzle-orm'
import type { privateMessageModel } from '../../models/private-message-model'

export type DrizzlePrivateMessage = InferSelectModel<typeof privateMessageModel>
