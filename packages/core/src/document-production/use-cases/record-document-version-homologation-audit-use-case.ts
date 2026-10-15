import type { AuditEventWriter, DatetimeProvider, UseCase } from '#shared/interfaces'

type Request = {
  readonly caseId: string
  readonly documentId: string
  readonly documentVersionId: string
  readonly homologationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: string
}

export class RecordDocumentVersionHomologationAuditUseCase
  implements UseCase<Request, void>
{
  constructor(
    private readonly auditEventWriter: AuditEventWriter,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<void> {
    await this.auditEventWriter.add({
      occurredAt: this.datetimeProvider.now(),
      actorId: request.collaboratorId,
      actorProfile: request.collaboratorProfile,
      entityType: 'piece',
      entityId: request.documentId,
      action: 'homologated',
      origin: 'human',
      status: 'success',
      afterData: {
        caseId: request.caseId,
        documentVersionId: request.documentVersionId,
        homologationId: request.homologationId,
      },
    })
  }
}
