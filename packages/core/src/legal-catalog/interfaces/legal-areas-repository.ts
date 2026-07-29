import type { LegalArea, LegalAreaCreation } from '../domain/entities'

export interface LegalAreasRepository {
  addMany(areas: LegalAreaCreation[]): Promise<LegalArea[]>
  findActive(): Promise<LegalArea[]>
  removeAll(): Promise<void>
}
