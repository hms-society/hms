import type { useChecklistDossierTab } from './use-checklist-dossier-tab'
import type { useListCaseDocumentExceptionsQuery } from '@/ui/document-engine/hooks/use-list-case-document-exceptions-query'
import type { useChecklistDossierTabContent } from './checklist-dossier-tab-content/use-checklist-dossier-tab-content'

export type { ChecklistDossierTabProps } from './checklist-dossier-tab-props'

export type ChecklistTabState = ReturnType<typeof useChecklistDossierTab>

export type DocumentException = ReturnType<
  typeof useListCaseDocumentExceptionsQuery
>['exceptions'][number]

export type ChecklistDossierController = ReturnType<typeof useChecklistDossierTabContent>
