import { Button } from '@/ui/shadcn/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/shadcn/empty'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DocumentSpecificationsEmptyStateProps = {
  filtered: boolean
  onClear: () => void
}

export const DocumentSpecificationsEmptyState = ({
  filtered,
  onClear,
}: DocumentSpecificationsEmptyStateProps) => (
  <Empty className='min-h-60 border border-border bg-card'>
    <EmptyHeader>
      <EmptyMedia variant='icon'>
        <Icon name='file-text' />
      </EmptyMedia>
      <EmptyTitle>
        {filtered ? 'Nenhum modelo encontrado' : 'Ainda não há modelos cadastrados'}
      </EmptyTitle>
      <EmptyDescription>
        {filtered
          ? 'Ajuste ou limpe os filtros para consultar outros modelos.'
          : 'Os modelos aparecerão aqui quando forem configurados.'}
      </EmptyDescription>
    </EmptyHeader>
    {filtered && (
      <Button type='button' variant='outline' onClick={onClear}>
        Limpar filtros
      </Button>
    )}
  </Empty>
)
