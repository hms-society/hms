import type { UseCase } from '../interfaces'
import type {
  AuditLogsRepository,
  ListAuditLogsQuery,
  PaginatedAuditEvents,
} from '../interfaces'

export class ListAuditLogsUseCase
  implements UseCase<ListAuditLogsQuery, PaginatedAuditEvents>
{
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  execute(query: ListAuditLogsQuery): Promise<PaginatedAuditEvents> {
    return this.auditLogsRepository.list(query)
  }
}
