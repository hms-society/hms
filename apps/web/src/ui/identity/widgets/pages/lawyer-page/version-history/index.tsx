import { Badge } from '@/ui/shadcn/badge'

export type VersionHistoryVersion = {
  id: string
  versionNumber: number
  status: string
  createdAt: string
  rejectionReason?: string
}

export type VersionHistoryProps = {
  versions: VersionHistoryVersion[]
  currentVersionId: string
  selectedVersionId?: string
  onSelectVersion?: (versionId: string) => void
}

export const VersionHistory = ({
  versions,
  currentVersionId,
  selectedVersionId = currentVersionId,
  onSelectVersion,
}: VersionHistoryProps) => (
  <aside className='border-r bg-card p-3'>
    <h2 className='mb-3 font-serif font-semibold'>Versões</h2>
    <div className='space-y-2'>
      {[...versions].reverse().map((version) => (
        <button
          type='button'
          key={version.id}
          aria-label={`Visualizar versão v${version.versionNumber}`}
          aria-pressed={version.id === selectedVersionId}
          disabled={!onSelectVersion}
          onClick={() => onSelectVersion?.(version.id)}
          className={`w-full rounded-md border p-3 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${version.id === selectedVersionId ? 'border-primary bg-highlight/70' : 'border-border hover:bg-muted/50'}`}
        >
          <div className='flex items-center justify-between gap-2'>
            <span className='font-semibold'>
              v{version.versionNumber}{' '}
              {version.id === currentVersionId ? (
                <span className='font-normal text-muted-foreground'>(Atual)</span>
              ) : null}
            </span>
            <Badge variant={version.id === currentVersionId ? 'success' : 'secondary'}>
              {{
                approved: 'Aprovada',
                in_review: 'Em revisão',
                rejected: 'Ajustes solicitados',
                generating: 'Gerando',
                generation_failed: 'Falha na geração',
              }[version.status] ?? version.status}
            </Badge>
          </div>
          <time dateTime={version.createdAt} className='mt-1 block text-muted-foreground'>
            {new Date(version.createdAt).toLocaleString('pt-BR')}
          </time>
          {version.rejectionReason ? (
            <p className='mt-1 text-muted-foreground'>{version.rejectionReason}</p>
          ) : null}
        </button>
      ))}
    </div>
  </aside>
)
