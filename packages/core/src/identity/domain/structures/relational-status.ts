export const RelationalStatus = {
  Lead: 'lead',
  Client: 'client',
  ProspectiveClient: 'prospective_client',
} as const

export type RelationalStatus = (typeof RelationalStatus)[keyof typeof RelationalStatus]
