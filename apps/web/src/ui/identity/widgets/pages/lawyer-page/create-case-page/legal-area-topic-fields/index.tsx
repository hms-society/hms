import { Controller, type Control, type UseFormSetValue } from 'react-hook-form'
import type { CreateCaseData } from '@hms/validation/case-management'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'

type NamedOption = { id: string; name: string }

export type LegalAreaTopicFieldsProps = {
  control: Control<CreateCaseData>
  setValue: UseFormSetValue<CreateCaseData>
  legalAreas: readonly NamedOption[]
  legalTopics: readonly NamedOption[]
  selectedLegalAreaId: string
  areaError?: string
  topicError?: string
}

export const LegalAreaTopicFields = ({
  control,
  setValue,
  legalAreas,
  legalTopics,
  selectedLegalAreaId,
  areaError,
  topicError,
}: LegalAreaTopicFieldsProps) => (
  <div className='flex flex-col sm:flex-row items-start gap-4'>
    <div className='space-y-1.5 w-full sm:flex-1 text-left'>
      <Label className='text-[14px] font-medium'>
        Área do Direito<span className='text-destructive'>*</span>
      </Label>
      <Controller
        control={control}
        name='legalAreaId'
        render={({ field }) => (
          <Select
            value={field.value ?? ''}
            onValueChange={(value) => {
              field.onChange(value)
              setValue('legalTopicId', '')
            }}
          >
            <SelectTrigger className='h-11 rounded-xl shadow-sm'>
              <SelectValue placeholder='Selecione a área' />
            </SelectTrigger>
            <SelectContent className='rounded-xl max-h-[300px]'>
              {legalAreas.map((area) => (
                <SelectItem key={area.id} value={area.id} className='rounded-lg'>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {areaError && <span className='text-xs text-destructive'>{areaError}</span>}
    </div>
    <div className='space-y-1.5 w-full sm:flex-1 text-left'>
      <Label className='text-[14px] font-medium'>
        Tema<span className='text-destructive'>*</span>
      </Label>
      <Controller
        control={control}
        name='legalTopicId'
        render={({ field }) => (
          <Select
            value={field.value ?? ''}
            onValueChange={field.onChange}
            disabled={!selectedLegalAreaId}
          >
            <SelectTrigger className='h-11 rounded-xl shadow-sm'>
              <SelectValue placeholder='Selecione o tema' />
            </SelectTrigger>
            <SelectContent className='rounded-xl max-h-[300px]'>
              {legalTopics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id} className='rounded-lg'>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {topicError && <span className='text-xs text-destructive'>{topicError}</span>}
    </div>
  </div>
)
