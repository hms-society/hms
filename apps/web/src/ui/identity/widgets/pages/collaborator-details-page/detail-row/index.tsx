export type DetailRowProps = {
  label: string
  value: string
}

export const DetailRow = ({ label, value }: DetailRowProps) => {
  return (
    <div className='flex items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3 text-sm'>
      <dt className='font-semibold text-muted-foreground'>{label}</dt>
      <dd className='text-right font-bold text-foreground'>{value}</dd>
    </div>
  )
}
