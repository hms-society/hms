import type { ClientDetails } from '@hms/core/identity/domain/entities'
import type { ConsentType } from '@hms/core/identity/domain/structures'

import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { CONSENT_LABELS } from '../use-client-search-result-step'
import { useClientSummary } from './use-client-summary'

export type ClientSummaryProps = {
  details: ClientDetails
}

export const ClientSummary = ({ details }: ClientSummaryProps) => {
  const { activeTypes, clientInitials, clientName, clientType, taxId, phone } =
    useClientSummary(details)

  return (
    <Card className='overflow-hidden rounded-2xl border-border bg-card shadow-sm'>
      <CardHeader className='flex-row items-start justify-between gap-4 p-5 pb-4'>
        <div className='flex min-w-0 items-start gap-3'>
          <Avatar size='lg' className='mt-0.5 rounded-xl'>
            <AvatarFallback className='rounded-xl bg-highlight text-sm font-semibold text-highlight-foreground'>
              {clientInitials}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0'>
            <p className='truncate font-serif text-xl font-medium text-card-foreground'>
              {clientName}
            </p>
            <p className='mt-0.5 text-xs font-medium text-muted-foreground'>
              {clientType} · {taxId}
            </p>
            <p className='mt-0.5 truncate text-xs text-muted-foreground'>{phone}</p>
          </div>
        </div>
        <Badge className='shrink-0 rounded-pill bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground'>
          Já cadastrado
        </Badge>
      </CardHeader>
      <CardContent className='border-t border-border/70 bg-muted/20 p-4'>
        <div className='mb-3 flex items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold text-card-foreground'>Consentimentos</p>
            <p className='mt-0.5 text-xs text-muted-foreground'>
              Status das autorizações do cliente
            </p>
          </div>
          <span className='text-xs text-muted-foreground'>3 opções</span>
        </div>
        <dl className='grid grid-cols-1 gap-2 text-sm'>
          {(
            Object.keys(CONSENT_LABELS) as Array<Exclude<ConsentType, 'data_processing'>>
          ).map(function renderConsentStatus(type) {
            const isRegistered = activeTypes.has(type)

            return (
              <div
                key={type}
                className='flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-2.5'
              >
                <dt className='font-medium text-card-foreground'>
                  {CONSENT_LABELS[type]}
                </dt>
                <dd
                  className={`flex items-center gap-1.5 text-xs font-medium ${isRegistered ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  <Icon
                    name={isRegistered ? 'check-circle-2' : 'circle'}
                    className='size-4'
                  />
                  {isRegistered ? 'Registrado' : 'Não registrado'}
                </dd>
              </div>
            )
          })}
        </dl>
      </CardContent>
    </Card>
  )
}
