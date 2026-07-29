import z from 'zod'

const serverEnv = {}

export const serverEnvSchema = z.object({})

export const SERVER_ENV = serverEnvSchema.parse(serverEnv)
