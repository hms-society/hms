import { cn } from '@/ui/shadcn/utils'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

export type DocumentStatusChipStatus =
  | 'not_generated'
  | 'in_review'
  | 'rejected'
  | 'approved'
  | 'generating'
  | 'failed'
  | 'current'

export type DocumentStatusChipProps = {
  status: DocumentStatusChipStatus
  label?: string
  className?: string
}

type StatusPresentation = {
  icon: IconName
  className: string
  label: string
}

const POSITIVE_STATUS_CLASS = 'border-primary/30 bg-highlight text-highlight-foreground'
const DESTRUCTIVE_STATUS_CLASS = 'border-destructive/30 bg-card text-destructive'

const STATUS_PRESENTATIONS: Record<DocumentStatusChipStatus, StatusPresentation> = {
  not_generated: {
    icon: 'file-text',
    className: 'border-border bg-background text-foreground',
    label: 'Não gerado',
  },
  in_review: { icon: 'eye', className: POSITIVE_STATUS_CLASS, label: 'Em revisão' },
  rejected: { icon: 'x', className: DESTRUCTIVE_STATUS_CLASS, label: 'Rejeitado' },
  approved: {
    icon: 'shield-check',
    className: POSITIVE_STATUS_CLASS,
    label: 'Aprovado',
  },
  generating: {
    icon: 'refresh-cw',
    className: POSITIVE_STATUS_CLASS,
    label: 'Gerando',
  },
  failed: {
    icon: 'triangle-alert',
    className: DESTRUCTIVE_STATUS_CLASS,
    label: 'Falha na geração',
  },
  current: {
    icon: 'shield-check',
    className: 'border-border bg-secondary text-secondary-foreground',
    label: 'Vigente',
  },
}

export const DocumentStatusChip = ({
  status,
  label,
  className,
}: DocumentStatusChipProps) => {
  const presentation = STATUS_PRESENTATIONS[status]

  return (
    <span
      data-status-chip={status}
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
        presentation.className,
        className,
      )}
    >
      <Icon name={presentation.icon} className='size-3' />
      {label ?? presentation.label}
    </span>
  )
}
