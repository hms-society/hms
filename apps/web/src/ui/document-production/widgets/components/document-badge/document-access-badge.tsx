import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ClassificacaoAcesso =
  | 'INTERNO'
  | 'CLIENTE'
  | 'RESTRITO'
  | 'CONFIDENCIAL'
  | 'PARCEIRO_LIBERADO'

interface DocumentAccessBadgeProps {
  classification?: ClassificacaoAcesso | null
  editable?: boolean
}

const badgeConfig: Record<ClassificacaoAcesso, { label: string; className: string }> = {
  INTERNO: {
    label: 'Interno',
    className:
      'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent dark:bg-slate-500/20 dark:text-slate-300',
  },
  CLIENTE: {
    label: 'Cliente',
    className:
      'bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent dark:bg-blue-500/20 dark:text-blue-300',
  },
  RESTRITO: {
    label: 'Restrito',
    className:
      'bg-amber-100 text-amber-700 hover:bg-amber-200 border-transparent dark:bg-amber-500/20 dark:text-amber-300',
  },
  CONFIDENCIAL: {
    label: 'Confidencial',
    className:
      'bg-red-100 text-red-700 hover:bg-red-200 border-transparent dark:bg-red-500/20 dark:text-red-300',
  },
  PARCEIRO_LIBERADO: {
    label: 'Parceiro Liberado',
    className:
      'bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent dark:bg-purple-500/20 dark:text-purple-300',
  },
}

export function DocumentAccessBadge({
  classification,
  editable,
}: DocumentAccessBadgeProps) {
  const safeClassification = classification || 'INTERNO'
  const config = badgeConfig[safeClassification] || badgeConfig.INTERNO

  return (
    <Badge className={`${config.className} font-medium shadow-sm whitespace-nowrap`}>
      {config.label}
      {editable && <Icon name='chevron-down' className='ml-1 size-3 opacity-70' />}
    </Badge>
  )
}
