import type {
  DocumentBatchAuditLogEntry,
  DocumentBatchAuditsRepository,
} from '../interfaces/document-batch-audits-repository'

export class RecordDocumentBatchAuditUseCase {
  constructor(private readonly auditsRepository: DocumentBatchAuditsRepository) {}

  async execute(entry: DocumentBatchAuditLogEntry): Promise<DocumentBatchAuditLogEntry> {
    return this.auditsRepository.add(entry)
  }
}
