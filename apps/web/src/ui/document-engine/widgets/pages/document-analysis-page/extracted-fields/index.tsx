import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useExtractedFields, type ExtractedFieldsProps } from './use-extracted-fields'

export type { ExtractedFieldsProps } from './use-extracted-fields'

export const ExtractedFields = ({ fields, title }: ExtractedFieldsProps) => {
  const { extractedCount, getFieldIcon, getFieldKey } = useExtractedFields(fields)

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h3 className='font-sans text-sm font-semibold text-foreground'>{title}</h3>
        <Badge variant='outline' className='px-1.5 py-0 text-[10px]'>
          {extractedCount} de {fields.length}
        </Badge>
      </div>
      <div className='flex flex-col gap-3'>
        {fields.map((field) => (
          <div
            key={getFieldKey(field)}
            className='flex flex-col gap-1.5 rounded-md border border-border bg-muted/30 p-3'
          >
            <span className='font-sans text-xs text-muted-foreground'>{field.label}</span>
            <div className='flex items-start gap-2'>
              <Icon
                name={getFieldIcon(field.label)}
                className='mt-0.5 size-4 shrink-0 text-muted-foreground'
              />
              <span className='min-w-0 whitespace-pre-wrap break-words font-sans text-sm font-medium text-foreground'>
                {field.value || 'Não identificado'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
