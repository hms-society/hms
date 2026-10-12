import type {
  CaseEligibleCollaborator,
  CaseOpeningSource,
} from '@hms/core/case-management/domain/structures'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Button } from '@/ui/shadcn/button'
import { ManagerSuggestionState } from '../manager-suggestion-state'

export type InitialManagerCardProps = {
  manager: CaseEligibleCollaborator | null
  openingSource?: CaseOpeningSource
  isLoadingSuggestion: boolean
  suggestionError: unknown
  selectionError?: string
  onSelectManager: () => void
}

export const InitialManagerCard = (props: InitialManagerCardProps) => (
  <div className='rounded-xl border border-border p-4'>
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <div className='min-w-0'>
        <p className='text-sm font-medium'>Gestor inicial</p>
        {props.manager ? (
          <div className='mt-2 flex items-center gap-3'>
            <Avatar className='size-10'>
              <AvatarFallback>
                {props.manager.professionalName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='truncate text-sm font-medium'>
                {props.manager.professionalName}
              </p>
              <p className='truncate text-xs text-muted-foreground'>
                {props.manager.email}
              </p>
            </div>
          </div>
        ) : (
          <p className='mt-1 text-sm text-muted-foreground'>
            Selecione um advogado ativo.
          </p>
        )}
        <ManagerSuggestionState
          isLoading={props.isLoadingSuggestion}
          error={props.suggestionError}
          isSuggested={Boolean(
            props.openingSource?.suggestedManager &&
              props.manager?.collaboratorId ===
                props.openingSource.suggestedManager.collaboratorId,
          )}
        />
      </div>
      <Button
        type='button'
        variant='outline'
        className='w-full shrink-0 rounded-full sm:w-auto'
        onClick={props.onSelectManager}
      >
        {props.manager ? 'Trocar gestor' : 'Selecionar gestor'}
      </Button>
    </div>
    {props.selectionError && (
      <p className='mt-2 text-xs text-destructive' role='alert'>
        {props.selectionError}
      </p>
    )}
  </div>
)
