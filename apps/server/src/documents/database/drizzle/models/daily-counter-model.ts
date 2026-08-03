import { date, integer, pgTable, primaryKey, varchar } from 'drizzle-orm/pg-core'

export const dailyCounterModel = pgTable(
  'daily_counters',
  {
    context: varchar('context', { length: 50 }).notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    count: integer('count').default(0).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.context, table.date] }),
  ],
)