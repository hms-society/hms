export interface LegalCatalogDatabase {
  transaction<Response>(work: () => Promise<Response>): Promise<Response>
}
