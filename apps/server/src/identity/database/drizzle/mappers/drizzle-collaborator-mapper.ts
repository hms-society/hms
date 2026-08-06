import type {
  Collaborator,
  CollaboratorSummary,
} from '@hms/core/identity/domain/entities'

import type {
  DrizzleCollaboratorRecord,
  DrizzleCollaboratorSummaryRecord,
} from '@/identity/database/drizzle/types'

export class DrizzleCollaboratorMapper {
  toDomain(record: DrizzleCollaboratorRecord): Collaborator {
    const legalExpertises = record.legalExpertises.map(({ expertise, topics }) => ({
      legalAreaId: expertise.legalAreaId,
      legalTopicIds: topics.map(({ legalTopicId }) => legalTopicId) as [
        string,
        ...string[],
      ],
    }))

    if (
      record.collaborator.profile === 'admin' ||
      record.collaborator.profile === 'attendant' ||
      record.collaborator.profile === 'client'
    ) {
      return {
        id: record.collaborator.id,
        userId: record.collaborator.userId,
        professionalName: record.collaborator.professionalName,
        jobTitle: record.collaborator.jobTitle ?? undefined,
        profile: record.collaborator.profile,
        createdAt: record.collaborator.createdAt,
        updatedAt: record.collaborator.updatedAt,
      }
    }

    return {
      id: record.collaborator.id,
      userId: record.collaborator.userId,
      professionalName: record.collaborator.professionalName,
      jobTitle: record.collaborator.jobTitle ?? undefined,
      profile: record.collaborator.profile,
      legalExpertises: legalExpertises as [
        (typeof legalExpertises)[number],
        ...(typeof legalExpertises)[number][],
      ],
      createdAt: record.collaborator.createdAt,
      updatedAt: record.collaborator.updatedAt,
    }
  }

  toSummary(record: DrizzleCollaboratorSummaryRecord): CollaboratorSummary {
    const base = {
      collaboratorId: record.collaborator.id,
      professionalName: record.collaborator.professionalName,
      email: record.user.email,
      jobTitle: record.collaborator.jobTitle ?? undefined,
      status: record.user.status,
      lastAccessAt: record.user.lastAccessAt ?? undefined,
    }

    if (
      record.collaborator.profile === 'admin' ||
      record.collaborator.profile === 'attendant' ||
      record.collaborator.profile === 'client'
    ) {
      return {
        ...base,
        profile: record.collaborator.profile,
      }
    }

    return {
      ...base,
      profile: record.collaborator.profile,
      legalExpertises: record.legalExpertises,
    }
  }
}
