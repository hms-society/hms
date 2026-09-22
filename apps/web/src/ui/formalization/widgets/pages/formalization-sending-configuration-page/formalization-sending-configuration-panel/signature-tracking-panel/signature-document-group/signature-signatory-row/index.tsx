import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { CollaboratorAvatar } from '@/ui/identity/widgets/components/collaborator-avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  useSignatureSignatoryRow,
  type SignatureSignatoryRowProps,
} from './use-signature-signatory-row'

export type { SignatureSignatoryRowProps } from './use-signature-signatory-row'

export const SignatureSignatoryRow = (props: SignatureSignatoryRowProps) => {
  const { channelLabel, getActionLabel, invitedAtLabel, statusLabel, submittedAtLabel } =
    useSignatureSignatoryRow(props)
  const statusId = `signatory-status-${props.signatory.recipientId}`
  const isSigned =
    props.signatory.status === 'submitted' || props.signatory.status === 'confirmed'

  return (
    <li className='flex flex-col gap-3 border-t border-border py-4 first:border-t-0 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'>
      <div className='flex min-w-0 items-start gap-3'>
        <CollaboratorAvatar
          name={props.signatory.displayName}
          colorSeed={props.signatory.recipientId}
        />
        <div className='min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <p className='truncate font-medium'>{props.signatory.displayName}</p>
            <Badge variant={isSigned ? 'success' : 'attention'} id={statusId}>
              {statusLabel}
            </Badge>
          </div>
          <dl className='mt-2 grid gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3'>
            <div>
              <dt>Canal</dt>
              <dd>{channelLabel}</dd>
            </div>
            <div>
              <dt>Convite</dt>
              <dd>{invitedAtLabel}</dd>
            </div>
            <div>
              <dt>Assinado</dt>
              <dd>{submittedAtLabel}</dd>
            </div>
          </dl>
          {props.signatory.protocolNumber && (
            <p className='mt-2 text-xs text-muted-foreground'>
              Protocolo:{' '}
              <span className='font-mono'>{props.signatory.protocolNumber}</span>
            </p>
          )}
        </div>
      </div>
      <Button
        type='button'
        variant='outline'
        className='min-h-11 w-full sm:w-auto'
        disabled={!props.signatory.canResend || props.isResending}
        aria-describedby={statusId}
        aria-label={getActionLabel()}
        onClick={() => props.onRequestResend(props.signatory)}
      >
        <Icon name='refresh-cw' className='size-4' />
        {props.isResending ? 'Reenviando…' : 'Reenviar convite'}
      </Button>
    </li>
  )
}
