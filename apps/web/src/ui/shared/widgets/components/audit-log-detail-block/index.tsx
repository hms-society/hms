export type AuditLogDetailBlockProps = {
  title: string
  value: unknown
}

export const AuditLogDetailBlock = ({ title, value }: AuditLogDetailBlockProps) => (
  <section className='space-y-2'>
    <h3 className='text-sm font-medium'>{title}</h3>
    <pre className='max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap'>
      {value === undefined ? '—' : JSON.stringify(value, null, 2)}
    </pre>
  </section>
)
