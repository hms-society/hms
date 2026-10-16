import type { UseFormRegister } from 'react-hook-form'
import type { CreateCaseData } from '@hms/validation/case-management'
import { Label } from '@/ui/shadcn/label'

export type CaseDescriptionFieldProps = {
  register: UseFormRegister<CreateCaseData>
}

export const CaseDescriptionField = ({ register }: CaseDescriptionFieldProps) => (
  <div className='space-y-2.5'>
    <Label className='text-[14px] font-medium'>
      Descrição <span className='text-muted-foreground font-normal'>(Opcional)</span>
    </Label>
    <textarea
      {...register('description')}
      placeholder='Breve descrição ou observação inicial do caso...'
      className='flex min-h-[100px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none'
    />
  </div>
)
