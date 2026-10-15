import { Icon } from '@/ui/shared/widgets/components/icon'

export const NoExtractedDataNotice = () => {
  return (
    <div
      className='flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3'
      role='note'
    >
      <Icon name='info' className='mt-0.5 size-4 shrink-0 text-primary' />
      <span className='font-sans text-xs text-muted-foreground'>
        A IA não conseguiu extrair nenhuma informação do documento recebido.
      </span>
    </div>
  )
}
