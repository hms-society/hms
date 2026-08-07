import type { DocumentSpecificationListItem } from '@hms/core/document-production/domain/structures'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DocumentSpecificationsApplicationProps = {
  item: DocumentSpecificationListItem
}

export const DocumentSpecificationsApplication = ({
  item,
}: DocumentSpecificationsApplicationProps) => {
  const momentIcons = {
    consultation: 'list-checks',
    formalization: 'file-text',
    legal_production: 'scale',
  } as const
  const momentLabels = {
    consultation: 'Consulta',
    formalization: 'Formalização',
    legal_production: 'Produção jurídica',
  } as const
  const applicationLabel =
    item.application.scope === 'global'
      ? 'Global'
      : item.application.legalExpertises
          .map((expertise) => {
            if (expertise.legalTopics.length > 1) {
              return `${expertise.legalAreaName} · ${expertise.legalTopics.length} temas`
            }
            if (expertise.legalTopics.length === 1) {
              return `${expertise.legalAreaName}: ${expertise.legalTopics[0].legalTopicName}`
            }
            return expertise.legalAreaName
          })
          .join(', ')

  return (
    <div className='flex min-w-0 flex-col gap-0.5'>
      <span className='inline-flex items-center gap-1.5 text-xs font-medium'>
        <Icon
          name={momentIcons[item.application.moment]}
          className='size-3.5 shrink-0 text-primary'
        />
        {momentLabels[item.application.moment]}
      </span>
      <span
        className='max-w-[18rem] truncate text-[11px] text-muted-foreground'
        title={applicationLabel}
      >
        {applicationLabel}
      </span>
    </div>
  )
}
