import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Input } from '@/ui/shadcn/input'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useAiSuggestionCard, type AiSuggestionCardProps } from './use-ai-suggestion-card'

export type { AiSuggestionCardProps }

export const AiSuggestionCard = (props: AiSuggestionCardProps) => {
  const {
    suggestion,
    isLowConfidence,
    isHighConfidence,
    isAdjusting,
    adjustedText,
    setAdjustedText,
    isRejecting,
    rejectionReasonText,
    setRejectionReasonText,
    isSubmitting,
    handleConfirmAccept,
    handleStartAdjust,
    handleCancelAdjust,
    handleConfirmAdjust,
    handleStartReject,
    handleCancelReject,
    handleConfirmReject,
    handleConfirmBlock,
  } = useAiSuggestionCard(props)

  const cardId = `ai-suggestion-card-${suggestion.id}`

  return (
    <Card
      id={cardId}
      className='shadow-sm border border-border/80 bg-card rounded-2xl overflow-hidden font-sans transition-all'
    >
      <CardContent className='p-4 sm:p-5 flex flex-col gap-3'>
        {/* Header Badges & Action Type */}
        <div className='flex items-center justify-between flex-wrap gap-2'>
          <div className='flex items-center gap-2'>
            <Badge className='bg-brand/10 text-brand border-brand/20 font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1.5'>
              <Icon name='sparkles' className='w-3.5 h-3.5 text-brand' />
              Sugestão IA
            </Badge>

            <span className='text-xs font-mono text-muted-foreground uppercase tracking-wider font-semibold'>
              {suggestion.suggestionType}
            </span>
          </div>

          {isLowConfidence && (
            <Badge className='bg-amber-100 text-amber-900 border-amber-300 font-semibold px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1'>
              <Icon name='triangle-alert' className='w-3.5 h-3.5 text-amber-700' />
              Revisão recomendada
            </Badge>
          )}

          {isHighConfidence && (
            <Badge className='bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold px-2.5 py-0.5 rounded-full text-xs'>
              Alta confiança
            </Badge>
          )}
        </div>

        {/* Suggested Content */}
        <div className='bg-muted/40 p-3.5 rounded-xl border border-border/40 space-y-1'>
          <span className='text-[10px] uppercase font-bold text-muted-foreground tracking-wider'>
            Conteúdo sugerido
          </span>
          <p className='text-sm text-foreground leading-relaxed font-medium'>
            {suggestion.content}
          </p>
        </div>

        {/* State: Accepted / Adjusted / Rejected / Blocked Status */}
        {suggestion.status === 'accepted' && (
          <div className='flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold'>
            <Icon name='check-circle-2' className='w-4 h-4 text-emerald-600' />
            Sugestão Aceita
          </div>
        )}

        {suggestion.status === 'adjusted' && (
          <div className='flex flex-col gap-1 p-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs'>
            <div className='flex items-center gap-2 font-semibold'>
              <Icon name='edit-3' className='w-4 h-4 text-blue-600' />
              Sugestão Ajustada
            </div>
            <p className='text-xs text-blue-800 mt-1 font-mono bg-white/60 p-2 rounded-lg border border-blue-100'>
              {suggestion.adjustedContent}
            </p>
          </div>
        )}

        {suggestion.status === 'rejected' && (
          <div className='flex flex-col gap-1 p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs'>
            <div className='flex items-center gap-2 font-semibold'>
              <Icon name='x-circle' className='w-4 h-4 text-destructive' />
              Sugestão Rejeitada
            </div>
            <p className='text-xs text-destructive/90 mt-0.5'>
              <span className='font-bold'>Motivo:</span> {suggestion.rejectionReason}
            </p>
          </div>
        )}

        {suggestion.status === 'blocked' && (
          <div className='flex items-center gap-2 p-2.5 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-300 text-xs font-semibold'>
            <Icon name='shield-alert' className='w-4 h-4 text-zinc-600' />
            Sugestão Bloqueada para esta entidade
          </div>
        )}

        {/* Inline Adjust Form */}
        {isAdjusting && (
          <div className='flex flex-col gap-2 pt-1 border-t border-border/50'>
            <label
              htmlFor={`adjust-input-${suggestion.id}`}
              className='text-xs font-semibold text-foreground'
            >
              Editar conteúdo sugerido
            </label>
            <Input
              id={`adjust-input-${suggestion.id}`}
              value={adjustedText}
              onChange={(e) => setAdjustedText(e.target.value)}
              placeholder='Digite a versão ajustada...'
              className='text-xs bg-background'
            />
            <div className='flex items-center justify-end gap-2 pt-1'>
              <Button
                size='sm'
                variant='ghost'
                onClick={handleCancelAdjust}
                disabled={isSubmitting}
                className='text-xs rounded-full h-8'
              >
                Cancelar
              </Button>
              <Button
                size='sm'
                onClick={handleConfirmAdjust}
                disabled={isSubmitting || !adjustedText.trim()}
                className='bg-brand hover:bg-brand/90 text-brand-foreground text-xs rounded-full h-8 px-4 font-semibold'
              >
                Confirmar Ajuste
              </Button>
            </div>
          </div>
        )}

        {/* Inline Reject Form */}
        {isRejecting && (
          <div className='flex flex-col gap-2 pt-1 border-t border-border/50'>
            <label
              htmlFor={`reject-reason-${suggestion.id}`}
              className='text-xs font-semibold text-destructive flex items-center gap-1'
            >
              Motivo da Rejeição <span className='text-destructive'>*</span>
            </label>
            <Textarea
              id={`reject-reason-${suggestion.id}`}
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              placeholder='Descreva obrigatoriamente o motivo da rejeição...'
              className='text-xs bg-background resize-none min-h-[70px]'
            />
            <div className='flex items-center justify-end gap-2 pt-1'>
              <Button
                size='sm'
                variant='ghost'
                onClick={handleCancelReject}
                disabled={isSubmitting}
                className='text-xs rounded-full h-8'
              >
                Cancelar
              </Button>
              <Button
                size='sm'
                variant='destructive'
                onClick={handleConfirmReject}
                disabled={isSubmitting || !rejectionReasonText.trim()}
                className='text-xs rounded-full h-8 px-4 font-semibold'
              >
                Confirmar Rejeição
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons (Pending Status) */}
        {suggestion.status === 'pending' && !isAdjusting && !isRejecting && (
          <div className='flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-border/40'>
            <div className='flex items-center gap-1.5 sm:gap-2'>
              {/* Aceitar Button */}
              <Button
                id={`btn-accept-${suggestion.id}`}
                size='sm'
                onClick={handleConfirmAccept}
                disabled={isSubmitting}
                variant={isHighConfidence ? 'default' : 'outline'}
                className={`text-xs rounded-full h-8 px-3.5 font-semibold gap-1.5 ${
                  isHighConfidence
                    ? 'bg-brand hover:bg-brand/90 text-brand-foreground shadow-sm'
                    : 'border-brand/40 text-brand hover:bg-brand/10'
                }`}
              >
                <Icon name='check' className='w-3.5 h-3.5' />
                Aceitar
              </Button>

              {/* Ajustar Button */}
              <Button
                id={`btn-adjust-${suggestion.id}`}
                size='sm'
                onClick={handleStartAdjust}
                disabled={isSubmitting}
                variant={isLowConfidence ? 'default' : 'outline'}
                className={`text-xs rounded-full h-8 px-3.5 font-semibold gap-1.5 ${
                  isLowConfidence
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                <Icon name='edit-3' className='w-3.5 h-3.5' />
                Ajustar
              </Button>

              {/* Rejeitar Button */}
              <Button
                id={`btn-reject-${suggestion.id}`}
                size='sm'
                variant='outline'
                onClick={handleStartReject}
                disabled={isSubmitting}
                className='text-xs rounded-full h-8 px-3.5 font-semibold gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10'
              >
                <Icon name='x' className='w-3.5 h-3.5' />
                Rejeitar
              </Button>
            </div>

            {/* Bloquear Action */}
            <Button
              id={`btn-block-${suggestion.id}`}
              size='sm'
              variant='ghost'
              onClick={handleConfirmBlock}
              disabled={isSubmitting}
              className='text-xs text-muted-foreground hover:text-foreground h-8 px-2 rounded-full gap-1'
              title='Bloquear novas sugestões deste tipo'
            >
              <Icon name='shield-alert' className='w-3.5 h-3.5' />
              Bloquear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
