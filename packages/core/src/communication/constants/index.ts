export const INTEGRATION_PROVIDERS = {
  EVOLUTION_API: 'EVOLUTION_API',
} as const

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[keyof typeof INTEGRATION_PROVIDERS]

export const EVOLUTION_EVENT_TYPES = {
  MESSAGES_UPSERT: 'messages.upsert',
  MESSAGES_UPDATE: 'messages.update',
  SEND_MESSAGE: 'send.message',
  CONNECTION_UPDATE: 'connection.update',
  QRCODE_UPDATED: 'qrcode.updated',
} as const

export type EvolutionEventType = (typeof EVOLUTION_EVENT_TYPES)[keyof typeof EVOLUTION_EVENT_TYPES]

export const INTEGRATION_EVENT_STATUS = {
  RECEBIDO: 'RECEBIDO',
  PROCESSADO: 'PROCESSADO',
  FALHA: 'FALHA',
} as const

export type IntegrationEventStatus = (typeof INTEGRATION_EVENT_STATUS)[keyof typeof INTEGRATION_EVENT_STATUS]
