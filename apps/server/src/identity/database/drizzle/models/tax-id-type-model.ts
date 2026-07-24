import { pgEnum } from 'drizzle-orm/pg-core'

export const taxIdTypeModel = pgEnum('tax_id_type', ['cpf', 'cnpj'])
