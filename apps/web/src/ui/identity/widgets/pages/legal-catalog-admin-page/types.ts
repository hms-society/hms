import type {
  LegalAreaWithTopics,
  LegalTopic,
} from '@hms/core/legal-catalog/domain/entities'

export type LegalCatalogFormKind = 'area' | 'topic'

export type LegalCatalogDialogState =
  | { kind: 'area'; area?: LegalAreaWithTopics }
  | { kind: 'topic'; topic?: LegalTopic }
