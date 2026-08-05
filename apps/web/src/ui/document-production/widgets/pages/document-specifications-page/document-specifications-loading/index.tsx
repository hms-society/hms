import { Card, CardContent } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'

export type DocumentSpecificationsLoadingProps = {
  label?: string
}

export const DocumentSpecificationsLoading = ({
  label = 'Carregando modelos de documentos',
}: DocumentSpecificationsLoadingProps) => (
  <Card aria-label={label}>
    <CardContent className='space-y-4 p-6'>
      {['one', 'two', 'three', 'four', 'five'].map((key) => (
        <Skeleton
          key={`document-specification-skeleton-${key}`}
          className='h-12 w-full'
        />
      ))}
    </CardContent>
  </Card>
)
