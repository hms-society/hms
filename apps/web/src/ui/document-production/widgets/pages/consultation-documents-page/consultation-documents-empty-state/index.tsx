import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/shadcn/empty'
import { Icon } from '@/ui/shared/widgets/components/icon'

export const ConsultationDocumentEmptyState = () => (
  <Empty className='min-h-60 border border-border bg-card'>
    <EmptyHeader>
      <EmptyMedia variant='icon'>
        <Icon name='file-text' />
      </EmptyMedia>
      <EmptyTitle>Nenhum documento vinculado</EmptyTitle>
      <EmptyDescription>
        Esta consulta ainda não possui documentos para produção.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
)
