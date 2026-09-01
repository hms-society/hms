import type { FormalizationDetails } from '@hms/core/formalization/domain/entities'

import { Badge } from '@/ui/shadcn/badge'
import { Card, CardContent } from '@/ui/shadcn/card'

export function FormalizationContextHeader({ data }: { data: FormalizationDetails }) {
  const { formalization, intake, client, consultation, assignedLawyer } = data
  const clientName = 'name' in client ? client.name : client.legalName
  const status =
    formalization.status === 'in_progress' ? 'Em andamento' : 'Somente leitura'

  return (
    <Card className='border border-border shadow-sm'>
      <CardContent className='grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='min-w-0 lg:col-span-2'>
          <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
            Formalização
          </p>
          <h1 className='mt-1 truncate font-serif text-3xl font-semibold tracking-tight text-brand'>
            {clientName}
          </h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Intake #{intake.sequenceNumber} · Consulta vinculada
          </p>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Advogado responsável</p>
          <p className='mt-1 text-sm font-semibold'>{assignedLawyer.professionalName}</p>
          <p className='mt-2 text-xs text-muted-foreground'>
            Pergunta central: {consultation.primaryLegalQuestion}
          </p>
        </div>
        <div className='flex items-start justify-between gap-3 sm:flex-col sm:items-end'>
          <Badge
            variant={formalization.status === 'in_progress' ? 'attention' : 'outline'}
          >
            {status}
          </Badge>
          <span className='text-xs text-muted-foreground'>
            Versão do agregado {formalization.version}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
