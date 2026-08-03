export type PaginationResponse<Item> = {
  readonly items: readonly Item[]
  readonly page: number
  readonly pageSize: number
  readonly total: number
  readonly totalPages: number
}
