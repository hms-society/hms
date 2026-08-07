import type { DocumentSpecification } from '@hms/core/document-production/domain/entities'
import type {
  DocumentSpecificationApplication,
  DocumentTemplateContent,
} from '@hms/core/document-production/domain/structures'

import type { DrizzleDocumentSpecification } from '@/document-production/database/drizzle/types'

export function serializeDocumentTemplateContent(content: DocumentTemplateContent) {
  return JSON.stringify(content)
}

function parseDocumentTemplateContent(content: string): DocumentTemplateContent {
  try {
    const parsed: unknown = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && 'type' in parsed)
      return parsed as DocumentTemplateContent
  } catch {
    // Existing rows may contain the legacy plain-text template format.
  }

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: content }],
      },
    ],
  } as unknown as DocumentTemplateContent
}

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
      content: parseDocumentTemplateContent(record.content),
      variables,
      application,
      isRequired: record.isRequired,
      status: record.status as DocumentSpecification['status'],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
