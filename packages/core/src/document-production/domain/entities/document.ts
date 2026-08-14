export type Document = {
  readonly id: string
  readonly title: string
  readonly currentVersionId?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}
