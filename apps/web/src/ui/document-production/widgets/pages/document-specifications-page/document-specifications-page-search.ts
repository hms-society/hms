import {
  DocumentGenerationMoment,
  DocumentSpecificationStatus,
} from '@hms/core/document-production/domain/structures'
import {
  parseAsStringLiteral,
  parseAsInteger,
  parseAsString,
  type inferParserType,
} from 'nuqs'

export const DOCUMENT_SPECIFICATIONS_SEARCH_PARAMS = {
  search: parseAsString.withDefault(''),
  legalAreaId: parseAsString,
  legalTopicId: parseAsString,
  moment: parseAsStringLiteral(
    Object.values(DocumentGenerationMoment) as [
      DocumentGenerationMoment,
      ...DocumentGenerationMoment[],
    ],
  ),
  status: parseAsStringLiteral(
    Object.values(DocumentSpecificationStatus) as [
      DocumentSpecificationStatus,
      ...DocumentSpecificationStatus[],
    ],
  ),
  page: parseAsInteger.withDefault(1),
  pageSize: parseAsInteger.withDefault(20),
}

export type DocumentSpecificationsSearchParams = inferParserType<
  typeof DOCUMENT_SPECIFICATIONS_SEARCH_PARAMS
>
