import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { CollaboratorAvatar } from '@/ui/identity/widgets/components/collaborator-avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useCandidateDialog } from './use-candidate-dialog'
import type { CandidateDialogProps } from './use-candidate-dialog'

export type { CandidateDialogProps } from './use-candidate-dialog'

const CANDIDATE_SKELETON_KEYS = [
  'candidate-skeleton-1',
  'candidate-skeleton-2',
  'candidate-skeleton-3',
] as const

export const CandidateDialog = (props: CandidateDialogProps) => {
  const {
    candidates,
    fetchNextCandidatesPage,
    handleSearchChange,
    hasNextCandidatePage,
    isErrorCandidates,
    isFetchingNextCandidatesPage,
    isLoadingCandidates,
    refetchCandidates,
    search,
  } = useCandidateDialog(props)

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-w-[620px] overflow-hidden p-0'>
        <DialogHeader className='border-b border-border bg-muted/20 p-6'>
          <div className='flex items-start gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <Icon name='user' className='size-5' />
            </span>
            <div>
              <DialogTitle>Adicionar signatário</DialogTitle>
              <DialogDescription className='mt-1'>
                Busque um colaborador elegível para esta formalização.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className='space-y-4 p-6 pt-5'>
          <div className='relative'>
            <Icon
              name='search'
              className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              aria-label='Buscar colaborador'
              placeholder='Nome ou e-mail'
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className='pl-9'
            />
          </div>
          <div
            className='max-h-80 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/10 p-2'
            aria-live='polite'
            aria-busy={isLoadingCandidates}
          >
            {isLoadingCandidates && (
              <>
                <span className='sr-only'>Buscando colaboradores...</span>
                {CANDIDATE_SKELETON_KEYS.map((skeletonKey) => (
                  <div
                    key={skeletonKey}
                    className='flex items-center gap-3 rounded-lg border border-transparent bg-background p-3'
                    aria-hidden='true'
                  >
                    <Skeleton className='size-10 rounded-full' />
                    <div className='min-w-0 flex-1 space-y-2'>
                      <Skeleton className='h-4 w-2/5' />
                      <Skeleton className='h-3 w-3/5' />
                    </div>
                    <Skeleton className='h-3 w-20 shrink-0' />
                  </div>
                ))}
              </>
            )}
            {isErrorCandidates && (
              <div className='flex items-center justify-between gap-3 p-3 text-sm text-destructive'>
                Não foi possível buscar colaboradores.
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => void refetchCandidates()}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {!isLoadingCandidates && !isErrorCandidates && candidates.length === 0 && (
              <p className='p-4 text-sm text-muted-foreground'>
                Nenhum colaborador encontrado.
              </p>
            )}
            {candidates.map((candidate) => (
              <button
                type='button'
                key={candidate.collaboratorId}
                className='flex w-full items-center gap-3 rounded-lg border border-transparent bg-background p-3 text-left transition-colors hover:border-border hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
                disabled={props.isPending}
                onClick={() => void props.onSelect(candidate.collaboratorId)}
              >
                <CollaboratorAvatar
                  name={candidate.name}
                  colorSeed={candidate.collaboratorId}
                />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate font-medium'>{candidate.name}</span>
                  <span className='block truncate text-xs text-muted-foreground'>
                    {candidate.email}
                  </span>
                </span>
                <span className='flex shrink-0 items-center gap-2 text-xs text-muted-foreground'>
                  {candidate.profileLabel}
                  <Icon name='arrow-right' className='size-4' />
                </span>
              </button>
            ))}
            {hasNextCandidatePage && (
              <Button
                type='button'
                variant='ghost'
                className='w-full'
                disabled={isFetchingNextCandidatesPage}
                onClick={() => void fetchNextCandidatesPage()}
              >
                {isFetchingNextCandidatesPage ? 'Carregando...' : 'Carregar mais'}
              </Button>
            )}
          </div>
        </div>
        <DialogFooter className='mx-0 mb-0 border-t border-border bg-muted/20 p-4 sm:p-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => props.onOpenChange(false)}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
