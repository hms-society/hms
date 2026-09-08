import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  bigint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const storedFileModel = pgTable(
  'stored_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    filePath: text('file_path').notNull(),
    fileName: text('file_name').notNull(),
    contentType: text('content_type').notNull(),
    sizeInBytes: bigint('size_in_bytes', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('stored_files_file_path_uq').on(table.filePath),
    check('stored_files_positive_size_ck', sql`${table.sizeInBytes} > 0`),
  ],
)
