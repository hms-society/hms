import { Badge } from '@/ui/shadcn/badge'
import { Card, CardContent } from '@/ui/shadcn/card'

import {
  useSignatureProgressSummary,
  type SignatureProgressSummaryProps,
} from './use-signature-progress-summary'

export type { SignatureProgressSummaryProps } from './use-signature-progress-summary'

export const SignatureProgressSummary = (props: SignatureProgressSummaryProps) => {
  const { completedLabel, failedLabel, progressPercentage, statusLabel } =
    useSignatureProgressSummary(props)

  return (
    <Card className='border-border shadow-none'>
      <CardContent className='grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center'>
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='font-serif text-lg font-semibold'>
              Acompanhamento das assinaturas
            </h3>
            <Badge
              variant={props.status.status === 'confirmed' ? 'success' : 'attention'}
            >
              {statusLabel}
            </Badge>
          </div>
          {props.isRefreshing && (
            <p className='sr-only' role='status'>
              Atualizando dados
            </p>
          )}
          <p className='mt-1 text-sm text-muted-foreground'>{completedLabel}</p>
          {failedLabel && <p className='mt-1 text-sm text-destructive'>{failedLabel}</p>}
          <div
            className='mt-3 h-2 overflow-hidden rounded-full bg-muted'
            role='progressbar'
            aria-label='Progresso das assinaturas'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercentage}
            aria-valuetext={`${progressPercentage}% concluído`}
          >
            <div
              className='h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none'
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <p className='font-serif text-3xl font-semibold text-brand sm:text-right'>
          {progressPercentage}%
        </p>
      </CardContent>
    </Card>
  )
}
