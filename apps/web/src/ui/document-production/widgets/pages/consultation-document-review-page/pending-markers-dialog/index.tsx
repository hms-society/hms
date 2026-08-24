import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { DocumentPendingMarker } from '@hms/core/document-production/domain/structures'

export type PendingMarkersDialogProps = {
  open: boolean
  markers: readonly DocumentPendingMarker[]
  isRemoving: boolean
  onOpenChange: (open: boolean) => void
  onLocate: (marker: string) => void
  onRemove: (marker: string) => void
  onRemoveAll: () => void
}

const pendingMarkerLabels: Readonly<Record<string, string>> = {
  area_juridica: 'Área jurídica',
  cliente_cpf: 'CPF do cliente',
  cliente_nome: 'Nome do cliente',
  endereco_imovel_comercial: 'Endereço do imóvel comercial',
  orientacao_fornecida: 'Orientação fornecida',
  questao_juridica_principal: 'Questão jurídica principal',
  tema_juridico: 'Tema jurídico',
  valor_honorarios: 'Valor dos honorários',
}

function getPendingMarkerLabel(marker: string) {
  const technicalName = marker.replace(/^\{+|\}+$/g, '')
  const knownLabel = pendingMarkerLabels[technicalName]
  if (knownLabel) return knownLabel

  return technicalName
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

export const PendingMarkersDialog = ({
  open,
  markers,
  isRemoving,
  onOpenChange,
  onLocate,
  onRemove,
  onRemoveAll,
}: PendingMarkersDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Pendências do documento</DialogTitle>
        <DialogDescription>
          {markers.length === 0
            ? 'Nenhuma pendência restante neste rascunho.'
            : `${markers.length} ${markers.length === 1 ? 'pendência identificada' : 'pendências identificadas'} neste documento.`}
        </DialogDescription>
      </DialogHeader>
      {markers.length > 0 && (
        <ul className='space-y-2'>
          {markers.map((item) => (
            <li
              key={item.marker}
              className='flex items-center justify-between gap-3 rounded-lg border p-3'
            >
              <div className='min-w-0 flex-1 space-y-0.5'>
                <p className='truncate text-sm font-semibold text-foreground'>
                  {getPendingMarkerLabel(item.marker)}
                </p>
                <code className='block truncate text-xs text-muted-foreground'>
                  {item.marker}
                </code>
              </div>
              <div className='flex shrink-0 items-center gap-2'>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={isRemoving}
                  className='items-center gap-1.5 leading-none'
                  onClick={() => onLocate(item.marker)}
                >
                  <Icon name='search' className='size-3.5 translate-y-px' />
                  <span>Localizar</span>
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant='destructive'
                  disabled={isRemoving}
                  className='items-center gap-1.5 leading-none'
                  onClick={() => onRemove(item.marker)}
                >
                  <Icon name='trash-2' className='size-3.5 translate-y-px' />
                  <span>Remover</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <DialogFooter>
        {markers.length > 0 && (
          <Button
            type='button'
            variant='outline'
            disabled={isRemoving}
            className='items-center gap-1.5 text-destructive leading-none hover:text-destructive'
            onClick={onRemoveAll}
          >
            <Icon name='trash-2' className='size-4 translate-y-px' />
            <span>Remover todas</span>
          </Button>
        )}
        <DialogClose asChild>
          <Button type='button' variant='outline'>
            Fechar
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
