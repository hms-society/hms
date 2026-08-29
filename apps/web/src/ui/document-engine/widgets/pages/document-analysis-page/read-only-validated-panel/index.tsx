import type { DocumentValidationDocument } from '@hms/core/document-engine/domain/entities'

import { Badge } from '@/ui/shadcn/badge'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'

export type ReadOnlyValidatedPanelProps = {
  document: DocumentValidationDocument
}

const FIELD_ICONS: Record<string, IconName> = {
  Titular: 'user',
  CPF: 'credit-card',
  Endereço: 'map-pin',
  CEP: 'map',
  'Data de emissão': 'calendar',
}

export const ReadOnlyValidatedPanel = ({ document }: ReadOnlyValidatedPanelProps) => {
  const extractedCount = document.extractedFields.filter(
    (field) => !field.isMissing && field.value,
  ).length
  const reviewedBy =
    document.reviewedByName ?? document.reviewedBy ?? 'responsável não identificado'
  const reviewedAt = document.reviewedAt
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(document.reviewedAt))
    : 'data não registrada'

  return (
    <aside className='flex flex-col overflow-y-auto bg-card'>
      <div className='flex flex-col gap-6 p-6'>
        <div className='flex items-center justify-between'>
          <h2 className='font-sans text-sm font-semibold text-foreground'>
            Resultado da validação
          </h2>
          <Badge
            variant='secondary'
            className='gap-1 border-0 bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-semibold text-[#1B5E20]'
          >
            <Icon name='check-circle-2' className='size-3' />
            Decisão registrada
          </Badge>
        </div>

        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between rounded-md border border-border bg-muted/30 p-3'>
            <div className='flex items-center gap-2'>
              <Icon name='shield-check' className='size-4 text-foreground' />
              <span className='font-sans text-sm font-medium text-foreground'>
                Documento validado
              </span>
            </div>
            <Icon name='lock' className='size-4 text-muted-foreground' />
          </div>
          <div className='flex items-start gap-3 rounded-md border border-[#A5D6A7] bg-[#E8F5E9]/50 p-4'>
            <div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]'>
              <Icon name='check' className='size-3 text-[#1B5E20]' />
            </div>
            <div className='flex flex-1 flex-col'>
              <span className='font-sans text-sm font-semibold text-[#1B5E20]'>
                Documento validado por {reviewedBy}
              </span>
              <span className='mt-0.5 font-sans text-xs text-[#1B5E20]/70'>
                Registro concluído em {reviewedAt}.
              </span>
            </div>
            <Icon name='check-circle-2' className='size-4 text-[#1B5E20]' />
          </div>
        </div>

        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <h2 className='font-sans text-sm font-semibold text-foreground'>
              Vínculo ao checklist
            </h2>
            <span className='flex items-center gap-1 font-sans text-[10px] text-muted-foreground'>
              <Icon name='lock' className='size-3' /> Somente leitura
            </span>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='flex flex-col gap-1.5'>
              <span className='font-sans text-xs text-muted-foreground'>Caso</span>
              <div className='flex h-10 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 font-sans text-sm text-foreground'>
                <Icon name='briefcase' className='size-4 text-muted-foreground' />
                {document.checklistLink?.caseLabel ?? 'Caso não informado'}
              </div>
            </div>
            <div className='flex flex-col gap-1.5'>
              <span className='font-sans text-xs text-muted-foreground'>
                Item do checklist
              </span>
              <div className='flex h-10 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 font-sans text-sm text-foreground'>
                <Icon name='list-checks' className='size-4 text-muted-foreground' />
                {document.checklistLink?.checklistItemLabel ?? 'Item não informado'}
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-3'>
          <div className='flex items-center justify-between'>
            <h2 className='font-sans text-sm font-semibold text-foreground'>
              Campos extraídos
            </h2>
            <div className='flex items-center gap-3'>
              <span className='flex items-center gap-1 font-sans text-[10px] text-muted-foreground'>
                <Icon name='lock' className='size-3' /> Somente leitura
              </span>
              <Badge variant='outline' className='px-1.5 py-0 text-[10px]'>
                {extractedCount} de {document.extractedFields.length}
              </Badge>
            </div>
          </div>
          <div className='flex flex-col gap-3'>
            {document.extractedFields.map((field) => (
              <div key={field.label} className='flex flex-col gap-1.5'>
                <span className='font-sans text-xs text-muted-foreground'>
                  {field.label}
                </span>
                <div className='flex h-10 items-center gap-2 rounded-md border border-border bg-muted/30 px-3 font-sans text-sm text-foreground'>
                  <Icon
                    name={FIELD_ICONS[field.label] ?? 'file-text'}
                    className='size-4 text-muted-foreground'
                  />
                  {field.value || 'Não identificado'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
