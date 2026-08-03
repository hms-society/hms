export type DetailFieldProps = {
  label: string
  value: string
  tone?: 'teal' | 'neutral'
}

export const DetailField = ({ label, value, tone = 'neutral' }: DetailFieldProps) => {
  return (
    <div className={`rounded-lg p-3 ${tone === 'teal' ? 'bg-secondary' : 'bg-muted'}`}>
      <dt className='text-xs font-semibold text-muted-foreground'>{label}</dt>
      <dd className='mt-1 truncate text-sm font-bold text-foreground'>{value}</dd>
    </div>
  )
}
