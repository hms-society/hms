import type { CaseHistoryRecord } from '../case-history-record'
import { CaseHistoryEntryFaker } from './case-history-entry-faker'
export class CaseHistoryRecordFaker {
  static fake(overrides: Partial<CaseHistoryRecord> = {}): CaseHistoryRecord {
    const entry = CaseHistoryEntryFaker.fake()
    return { ...entry, sourceKey: `manual:${entry.id}`, ...overrides }
  }
  static fakeMany(count = 10): CaseHistoryRecord[] {
    return Array.from({ length: count }, () => CaseHistoryRecordFaker.fake())
  }
}
