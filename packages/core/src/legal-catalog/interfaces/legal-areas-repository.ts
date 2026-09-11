import type { LegalArea, LegalAreaCreation, LegalAreaUpdate } from '../domain/entities'

export interface LegalAreasRepository {
  addMany(areas: LegalAreaCreation[]): Promise<LegalArea[]>
  findAll(): Promise<LegalArea[]>
  findActive(): Promise<LegalArea[]>
  findById(legalAreaId: string): Promise<LegalArea | undefined>
  findByName(name: string): Promise<LegalArea | undefined>
  replace(legalAreaId: string, changes: LegalAreaUpdate): Promise<LegalArea | undefined>
  removeAll(): Promise<void>
}
