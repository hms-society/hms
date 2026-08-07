import type { DocumentSpecification } from '@hms/core/document-production/domain/entities'
import type { DocumentSpecificationApplication } from '@hms/core/document-production/domain/structures'

import type { DrizzleDocumentSpecification } from '@/document-production/database/drizzle/types'

export class DrizzleDocumentSpecificationMapper {
  toDomain(record: DrizzleDocumentSpecification): DocumentSpecification {
    const variables = record.variables as DocumentSpecification['variables']

    return {
      id: record.id,
      name: record.name,
      description: record.description,
      content: record.content,
      variables,
      application: {
        scope: record.scope as DocumentSpecificationApplication['scope'],
        moment: record.moment as DocumentSpecificationApplication['moment'],
        legalAreaIds: [],
        legalTopicIdsByArea: {},
      },
      isRequired: record.isRequired,
      status: record.status as DocumentSpecification['status'],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
