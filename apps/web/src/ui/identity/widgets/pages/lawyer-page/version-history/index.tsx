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
}

export const VersionHistory = ({
  versions,
  currentVersionId,
}: VersionHistoryProps) => (
  <aside className='border-r bg-card p-3'>
    <h2 className='mb-3 font-serif font-semibold'>Versões</h2>
    <div className='space-y-2'>
      {[...versions].reverse().map((version) => (
        <article
          key={version.id}
          aria-current={version.id === currentVersionId ? 'true' : undefined}
          className={`rounded-md border p-3 text-xs ${version.id === currentVersionId ? 'border-primary bg-highlight/70' : 'border-border'}`}
        >
          <div className='flex items-center justify-between gap-2'>
            <span className='font-semibold'>v{version.versionNumber}</span>
            <Badge variant={version.id === currentVersionId ? 'success' : 'secondary'}>
              {({
                approved: 'Aprovada',
                in_review: 'Em revisão',
                rejected: 'Ajustes solicitados',
                generating: 'Gerando',
                generation_failed: 'Falha na geração',
              }[version.status] ?? version.status)}
            </Badge>
          </div>
          <time dateTime={version.createdAt} className='mt-1 block text-muted-foreground'>
            {new Date(version.createdAt).toLocaleString('pt-BR')}
          </time>
          {version.rejectionReason ? (
            <p className='mt-1 text-muted-foreground'>{version.rejectionReason}</p>
          ) : null}
        </article>
      ))}
    </div>
  </aside>
)
