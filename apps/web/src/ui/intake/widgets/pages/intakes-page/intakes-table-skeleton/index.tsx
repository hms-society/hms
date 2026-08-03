import { Skeleton } from '@/ui/shadcn/skeleton'

const SKELETON_ROW_KEYS = ['one', 'two', 'three', 'four', 'five']

export type IntakesTableSkeletonProps = {
  rows?: number
}

export const IntakesTableSkeleton = ({ rows = 5 }: IntakesTableSkeletonProps) => (
  <div role='status' aria-label='Carregando intakes' className='p-4'>
    <span className='sr-only'>Carregando intakes</span>
    <div className='space-y-3'>
      {SKELETON_ROW_KEYS.slice(0, rows).map((rowKey) => (
        <div key={rowKey} className='grid grid-cols-6 gap-4 py-3'>
          <Skeleton className='h-5 w-24' />
          <Skeleton className='h-5 w-28' />
          <Skeleton className='h-5 w-36' />
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-5 w-20' />
          <Skeleton className='h-5 w-16' />
        </div>
      ))}
    </div>
  </div>
)
