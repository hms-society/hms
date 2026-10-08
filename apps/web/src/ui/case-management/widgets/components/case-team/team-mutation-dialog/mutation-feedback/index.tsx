import { Label } from '@/ui/shadcn/label'
import { Textarea } from '@/ui/shadcn/textarea'

export type MutationFeedbackProps = {
  showReason: boolean
  isReasonRequired: boolean
  reason: string
  error: string | null
  hasVersionConflict: boolean
  isLastManagerRemoval: boolean
  onReasonChange: (reason: string) => void
}

export const MutationFeedback = ({
  showReason,
  isReasonRequired,
  reason,
  error,
  hasVersionConflict,
  isLastManagerRemoval,
  onReasonChange,
}: MutationFeedbackProps) => (
  <>
    {showReason && (
      <div className='space-y-2'>
        <Label htmlFor='team-admin-reason'>Justificativa administrativa</Label>
        <Textarea
          id='team-admin-reason'
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          aria-required={isReasonRequired}
          aria-invalid={Boolean(error && isReasonRequired && reason.trim().length === 0)}
          aria-describedby='team-admin-reason-hint'
          className='min-h-24'
        />
        <p id='team-admin-reason-hint' className='text-xs text-muted-foreground'>
          {isReasonRequired
            ? 'Obrigatória para registrar a remoção no histórico.'
            : 'Opcional. Se preenchida, será registrada no histórico.'}
        </p>
      </div>
    )}
    {isLastManagerRemoval && (
      <p role='alert' className='text-sm text-destructive'>
        Pelo menos uma pessoa deve permanecer como Gestora.
      </p>
    )}
    {hasVersionConflict && (
      <p role='status' className='text-sm text-muted-foreground'>
        A equipe foi recarregada. Confirme novamente para enviar uma nova intenção.
      </p>
    )}
    {error && (
      <p role='alert' className='text-sm text-destructive'>
        {error}
      </p>
    )}
  </>
)
