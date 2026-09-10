import { Search } from 'lucide-react'
import { Input } from '@/ui/shadcn/input'

type ChecklistSearchProps = {
  value: string
  onChange: (value: string) => void
}

export function ChecklistSearch({
  value,
  onChange,
}: ChecklistSearchProps) {
  return (
    <div className='relative w-full md:w-[275px]'>
      <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />

      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder='Buscar documento por nome...'
        className='h-10 pl-9'
      />
    </div>
  )
}
