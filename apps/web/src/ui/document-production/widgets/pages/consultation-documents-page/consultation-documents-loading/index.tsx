import { Card, CardContent } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'

export type ConsultationDocumentsLoadingProps = {
  label?: string
}

export const ConsultationDocumentsLoading = ({
  label = 'Carregando documentos da consulta',
}: ConsultationDocumentsLoadingProps) => (
  <Card aria-label={label} aria-busy='true'>
    <CardContent className='space-y-3 p-4 sm:p-6'>
      {['one', 'two', 'three', 'four'].map((key) => (
        <Skeleton key={`consultation-document-skeleton-${key}`} className='h-14 w-full' />
      ))}
    </CardContent>
  </Card>
)
