import { customType } from 'drizzle-orm/pg-core'

export const signatureBytea = customType<{
  data: Buffer
  driverData: Buffer
}>({
  dataType: () => 'bytea',
})
