export type AuditFilterSelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly [string, string][]
}

export const AuditFilterSelect = ({
  id,
  label,
  value,
  onChange,
  options,
}: AuditFilterSelectProps) => (
  <div className='space-y-2'>
    <label htmlFor={id} className='text-sm font-medium'>
      {label}
    </label>
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm'
    >
      <option value=''>Todos</option>
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  </div>
)
