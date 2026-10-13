export type LegalCaseOperationalRecordsQuery = {
  readonly search?: string
  readonly matchingClientIds: readonly string[]
  readonly page: number
  readonly pageSize: number
}
