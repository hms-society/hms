import type {
  DocumentPackage,
  DocumentVersion,
} from '../../document-production/domain/entities'
import type {
  DocumentPackagesRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '../../document-production/interfaces'
import { DocumentVersionStatus } from '../../document-production/domain/structures'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'
import type { DatetimeProvider, UseCase } from '#shared/interfaces'

import {
  ConsultationDocumentAccessDeniedError,
  ConsultationNotFoundError,
  ConsultationPackageConfirmationError,
} from '../domain/errors'
import type { ConsultationsRepository } from '../interfaces'

type Request = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
}

export class ConfirmConsultationDocumentPackageUseCase
  implements UseCase<Request, DocumentPackage>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
    private readonly documentVersionsRepository: DocumentVersionsRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request) {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()
    if (
      request.collaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== request.collaboratorId
    ) {
      throw new ConsultationDocumentAccessDeniedError()
    }
    if (!consultation.attendanceFinalizedAt) {
      throw new ConsultationPackageConfirmationError(
        'Finalize a ficha de atendimento antes de confirmar o pacote.',
      )
    }

    const documentPackage = await this.documentPackagesRepository.findByContext({
      type: 'consultation',
      consultationId: request.consultationId,
    })
    if (!documentPackage) {
      throw new ConsultationPackageConfirmationError(
        'Selecione ao menos um documento antes de confirmar o pacote.',
      )
    }
    if (documentPackage.confirmedAt) {
      throw new ConsultationPackageConfirmationError(
        'O pacote de documentos já foi confirmado.',
      )
    }

    const packageDocuments =
      await this.packageDocumentsRepository.findByDocumentPackageId(documentPackage.id)
    if (packageDocuments.length === 0) {
      throw new ConsultationPackageConfirmationError(
        'Selecione ao menos um documento antes de confirmar o pacote.',
      )
    }

    const versions = await this.documentVersionsRepository.findByDocumentIds(
      packageDocuments.map((document) => document.documentId),
    )
    const latestVersions = latestVersionsByDocumentId(versions)
    const hasUnfinishedDocument = packageDocuments.some((document) => {
      const latestVersion = latestVersions.get(document.documentId)
      return (
        !latestVersion ||
        (latestVersion.status !== DocumentVersionStatus.Approved &&
          latestVersion.status !== DocumentVersionStatus.Rejected)
      )
    })
    if (hasUnfinishedDocument) {
      throw new ConsultationPackageConfirmationError(
        'Gere e revise todos os documentos antes de confirmar o pacote.',
      )
    }

    const confirmed = await this.documentPackagesRepository.confirm(
      documentPackage.id,
      request.collaboratorId,
      this.datetimeProvider.now(),
    )
    if (!confirmed) {
      throw new ConsultationPackageConfirmationError(
        'Não foi possível confirmar o pacote de documentos.',
      )
    }
    return confirmed
  }
}

function latestVersionsByDocumentId(versions: readonly DocumentVersion[]) {
  const latestVersions = new Map<string, DocumentVersion>()
  for (const version of versions) {
    const current = latestVersions.get(version.documentId)
    if (!current || version.versionNumber > current.versionNumber) {
      latestVersions.set(version.documentId, version)
    }
  }
  return latestVersions
}
