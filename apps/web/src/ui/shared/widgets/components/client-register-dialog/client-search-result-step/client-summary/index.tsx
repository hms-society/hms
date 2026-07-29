import type { ClientDetails } from '@hms/core/identity/domain/entities'
import type { ConsentType } from '@hms/core/identity/domain/structures'

import { Badge } from '@/ui/shadcn/badge'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { CONSENT_LABELS } from '../use-client-search-result-step'
import { useClientSummary } from './use-client-summary'

export type ClientSummaryProps = {
  details: ClientDetails
}

export const ClientSummary = ({ details }: ClientSummaryProps) => {
  const { activeTypes, clientName, taxId, phone } = useClientSummary(details)

  return (
    <Card className='border-border/70 shadow-sm'>
      <CardHeader className='flex-row items-start justify-between gap-4'>
        <div>
          <p className='font-serif text-xl'>{clientName}</p>
          <p className='text-sm text-muted-foreground'>
            {taxId} · {phone}
          </p>
        </div>
        <Badge variant='secondary'>Já cadastrado</Badge>
      </CardHeader>
      <CardContent>
        <dl className='grid gap-2 text-sm sm:grid-cols-2'>
          {(Object.keys(CONSENT_LABELS) as ConsentType[]).map(
            function renderConsentStatus(type) {
              return (
                <div
                  key={type}
                  className='flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2'
                >
                  <dt>{CONSENT_LABELS[type]}</dt>
                  <dd className='flex items-center gap-1.5 text-muted-foreground'>
                    <Icon name={activeTypes.has(type) ? 'check' : 'circle'} />
                    {activeTypes.has(type) ? 'Registrado' : 'Não registrado'}
                  </dd>
                </div>
              )
            },
          )}
        </dl>
      </CardContent>
    </Card>
  )
}
