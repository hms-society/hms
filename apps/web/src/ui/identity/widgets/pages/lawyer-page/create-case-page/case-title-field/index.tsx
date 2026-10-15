import type { UseFormRegister } from 'react-hook-form'
import type { CreateCaseData } from '@hms/validation/case-management'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'

export type CaseTitleFieldProps = {
  register: UseFormRegister<CreateCaseData>
  error?: string
}

export const CaseTitleField = ({ register, error }: CaseTitleFieldProps) => (
  <div className='space-y-1.5 text-left'>
    <Label className='text-[14px] font-medium'>
      Título do caso<span className='text-destructive'>*</span>
    </Label>
    <Input
      {...register('title')}
      placeholder='Ex: Aposentadoria por Tempo de Contribuição'
      className='h-11 rounded-xl shadow-sm'
    />
    {error && <span className='text-xs text-destructive'>{error}</span>}
  </div>
)
