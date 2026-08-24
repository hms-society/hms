import { Badge } from '@/ui/shadcn/badge'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DocumentBatchCard } from './document-batch-card'
import {
  type ClientDocumentsTabProps,
  useClientDocumentsTab,
} from './use-client-documents-tab'

export type { ClientDocumentsTabProps } from './use-client-documents-tab'

export const ClientDocumentsTab = ({ clientId }: ClientDocumentsTabProps) => {
  const { batches, isError, isLoading } = useClientDocumentsTab({ clientId })

  if (isLoading) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <span className='text-sm text-muted-foreground'>Carregando documentos...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className='flex h-40 items-center justify-center'>
        <span className='text-sm text-destructive'>Erro ao carregar os documentos.</span>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6 pt-2'>
      <div className='flex items-center gap-4'>
        <NativeSelect size='sm' className='w-32 bg-card'>
          <NativeSelectOption value=''>Canal</NativeSelectOption>
          <NativeSelectOption value='whatsapp'>WhatsApp</NativeSelectOption>
          <NativeSelectOption value='upload'>Upload interno</NativeSelectOption>
        </NativeSelect>

        <NativeSelect size='sm' className='w-32 bg-card'>
          <NativeSelectOption value=''>Status</NativeSelectOption>
          <NativeSelectOption value='validado'>Validado</NativeSelectOption>
          <NativeSelectOption value='pendente'>Pendente</NativeSelectOption>
        </NativeSelect>

        <Badge
          variant='outline'
          className='ml-2 gap-1.5 border-orange-200 bg-orange-50 px-3 py-1 font-normal text-orange-600'
        >
          <Icon name='triangle-alert' className='h-3.5 w-3.5' /> Revisão pendente (1)
        </Badge>
      </div>

      <div className='flex flex-col'>
        {batches.length === 0 ? (
          <div className='rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground'>
            Nenhum lote de documentos encontrado.
          </div>
        ) : (
          batches.map((batch: any) => <DocumentBatchCard key={batch.id} batch={batch} />)
        )}
      </div>
    </div>
  )
}
