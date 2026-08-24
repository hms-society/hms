import type { DocumentSpecification } from '@hms/core/document-production/domain/entities'
import type { DocumentSpecificationApplication } from '@hms/core/document-production/domain/structures'

import type { DrizzleDocumentSpecification } from '@/document-production/database/drizzle/types'

export class DrizzleDocumentSpecificationMapper {
  toDomain(record: DrizzleDocumentSpecification): DocumentSpecification {
    const variables = record.variables as DocumentSpecification['variables']
    const application: DocumentSpecificationApplication =
      record.scope === 'global'
        ? {
            scope: 'global',
            moment: record.moment as DocumentSpecificationApplication['moment'],
          }
        : {
            scope: 'legal_context',
            moment: record.moment as DocumentSpecificationApplication['moment'],
            legalAreaIds: [],
            legalTopicIdsByArea: {},
          }

    return {
      id: record.id,
      name: record.name,
      description: record.description,
      content: record.content,
      variables,
      application,
      status: record.status as DocumentSpecification['status'],
      accessClassification: record.accessClassification,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
