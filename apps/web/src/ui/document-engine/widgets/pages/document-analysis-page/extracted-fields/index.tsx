import { Badge } from '@/ui/shadcn/badge'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useExtractedFields, type ExtractedFieldsProps } from './use-extracted-fields'

export type { ExtractedFieldsProps } from './use-extracted-fields'

export const ExtractedFields = ({ fields, title }: ExtractedFieldsProps) => {
  const { extractedCount, getFieldIcon } = useExtractedFields(fields)

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
          <div key={field.label} className='flex flex-col gap-1.5'>
            <label
              htmlFor={`extracted-${field.label}`}
              className='font-sans text-xs text-muted-foreground'
            >
              {field.label}
            </label>
            <div className='relative'>
              <Icon
                name={getFieldIcon(field.label)}
                className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
              />
              <Input
                id={`extracted-${field.label}`}
                className='h-11 rounded-md bg-card pl-9 pr-9 font-sans text-sm'
                defaultValue={field.value || 'Não identificado'}
                readOnly
              />
              <Icon
                name='pencil'
                className='absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-primary'
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
