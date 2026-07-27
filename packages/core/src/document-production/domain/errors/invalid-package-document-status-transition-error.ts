import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

import type { PackageDocumentStatus } from '../structures'

export class InvalidPackageDocumentStatusTransitionError extends ConflictError {
  constructor(currentStatus: PackageDocumentStatus, targetStatus: PackageDocumentStatus) {
    super(`O documento não pode passar do estado ${currentStatus} para ${targetStatus}.`)
  }
}
