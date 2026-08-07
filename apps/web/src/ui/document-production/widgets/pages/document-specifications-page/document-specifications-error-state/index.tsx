import { Button } from '@/ui/shadcn/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/ui/shadcn/empty'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type DocumentSpecificationsErrorStateProps = {
  onRetry: () => void
}

export const DocumentSpecificationsErrorState = ({
  onRetry,
}: DocumentSpecificationsErrorStateProps) => (
  <Empty className='min-h-64 border border-destructive/30 bg-card'>
    <EmptyHeader>
      <EmptyMedia variant='icon'>
        <Icon name='triangle-alert' />
      </EmptyMedia>
      <EmptyTitle>Não foi possível carregar os modelos</EmptyTitle>
      <EmptyDescription>Verifique sua conexão e tente novamente.</EmptyDescription>
    </EmptyHeader>
    <Button type='button' variant='outline' onClick={onRetry}>
      <Icon name='refresh-cw' />
      Tentar novamente
    </Button>
  </Empty>
)
