import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'

export type LawyerCaseHeaderActionsProps = {
  isGeneratingPortalLink: boolean
  onOpenPortal: () => void
  dossierApproved: boolean
  onOpenNewPiece: () => void
}

export const LawyerCaseHeaderActions = ({
  isGeneratingPortalLink,
  onOpenPortal,
  dossierApproved,
  onOpenNewPiece,
}: LawyerCaseHeaderActionsProps) => (
  <div className='flex flex-wrap items-center justify-end gap-2'>
    <Button
      variant='outline'
      size='xs'
      className='rounded-full bg-accent text-accent-foreground'
    >
      <Icon name='plus' className='size-3' />
      Nova tarefa
    </Button>
    <Button
      variant='outline'
      size='xs'
      className='rounded-full border-primary bg-background text-primary hover:bg-primary/10'
      disabled={isGeneratingPortalLink}
      onClick={onOpenPortal}
    >
      <Icon name='link' className='size-3' />
      {isGeneratingPortalLink ? 'Gerando link...' : 'Gerar link para terceiro'}
    </Button>
    <Button
      size='xs'
      className='rounded-full'
      disabled={!dossierApproved}
      onClick={onOpenNewPiece}
    >
      <Icon name='plus' className='size-3' />
      Nova peça
    </Button>
  </div>
)
