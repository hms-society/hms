import { Skeleton } from '@/ui/shadcn/skeleton'

export function CollaboratorsTableSkeleton() {
  const skeletons = ['one', 'two', 'three', 'four', 'five']

  return (
    <div className='space-y-3 p-4' role='status' aria-label='Carregando colaboradores'>
      {skeletons.map((skeleton) => (
        <Skeleton key={skeleton} className='h-12 w-full' />
      ))}
    </div>
  )
}
