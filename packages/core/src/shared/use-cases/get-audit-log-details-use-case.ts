import type { AuditEvent } from '../domain/structures'
import type { AuditLogsRepository } from '../interfaces'

export class GetAuditLogDetailsUseCase {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  execute(request: { id: string }): Promise<AuditEvent | undefined> {
    return this.auditLogsRepository.findById(request.id)
  }
}
