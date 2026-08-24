import { Badge } from '@/ui/shadcn/badge'
import { Field } from '@/ui/shadcn/field'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  useChecklistLinkFields,
  type ChecklistLinkFieldsProps,
} from './use-checklist-link-fields'

export type { ChecklistLinkFieldsProps } from './use-checklist-link-fields'

export const ChecklistLinkFields = ({
  document,
  form,
  isChecklistDisabled = false,
}: ChecklistLinkFieldsProps) => {
  const { caseLabel, checklistItemLabel, checklistRequirementId, documentTypeId } =
    useChecklistLinkFields({ document, form, isChecklistDisabled })

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <h3 className='font-sans text-sm font-semibold text-foreground'>
          Vínculo ao checklist
        </h3>
        {isChecklistDisabled && (
          <Badge
            variant='secondary'
            className='gap-1 border-0 bg-muted px-2 py-0.5 text-[10px]'
          >
            <Icon name='link' className='size-3' />
            Não vinculado
          </Badge>
        )}
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <Field>
          <label
            htmlFor='documentTypeId'
            className='font-sans text-xs text-muted-foreground'
          >
            Caso
          </label>
          <NativeSelect
            id='documentTypeId'
            className='h-11 w-full font-sans text-sm'
            {...form.register('documentTypeId')}
          >
            <NativeSelectOption value=''>Selecionar caso</NativeSelectOption>
            {documentTypeId && (
              <NativeSelectOption value={documentTypeId}>
                {caseLabel || documentTypeId}
              </NativeSelectOption>
            )}
          </NativeSelect>
        </Field>
        <Field>
          <label
            htmlFor='checklistRequirementId'
            className='font-sans text-xs text-muted-foreground'
          >
            Item do checklist
          </label>
          <NativeSelect
            id='checklistRequirementId'
            className='h-11 w-full font-sans text-sm'
            disabled={isChecklistDisabled}
            {...form.register('checklistRequirementId')}
          >
            <NativeSelectOption value=''>Selecione o caso primeiro</NativeSelectOption>
            {checklistRequirementId && (
              <NativeSelectOption value={checklistRequirementId}>
                {checklistItemLabel || checklistRequirementId}
              </NativeSelectOption>
            )}
          </NativeSelect>
        </Field>
      </div>
    </div>
  )
}
