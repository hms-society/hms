import { Badge } from '@/ui/shadcn/badge'
import { Field } from '@/ui/shadcn/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
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
  const {
    caseId,
    caseOptions,
    checklistItemLabel,
    checklistOptions,
    checklistRequirementId,
    handleCaseSelect,
    handleChecklistSelect,
    isLoadingCases,
    isLoadingChecklist,
  } = useChecklistLinkFields({ document, form, isChecklistDisabled })

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
            htmlFor='caseId'
            className='font-sans text-xs text-muted-foreground'
          >
            Caso
          </label>
          <Select
            value={caseId || undefined}
            onValueChange={handleCaseSelect}
            disabled={isLoadingCases}
          >
            <SelectTrigger
              id='caseId'
              className='h-12 w-full rounded-xl border-border bg-card px-4 font-sans text-sm font-medium shadow-sm hover:border-primary/50 hover:bg-highlight/30 focus:ring-primary/20'
            >
              <SelectValue
                placeholder={isLoadingCases ? 'Carregando casos...' : 'Selecionar caso'}
              />
            </SelectTrigger>
            <SelectContent
              position='popper'
              align='start'
              className='max-h-72 min-w-[var(--radix-select-trigger-width)] rounded-xl border border-border bg-card p-1.5 shadow-lg ring-0'
            >
              {caseOptions.map((caseOption) => (
                <SelectItem
                  key={caseOption.id}
                  value={caseOption.id}
                  className='min-h-10 rounded-lg px-3 py-2 font-sans text-sm text-foreground focus:bg-highlight focus:text-foreground data-[state=checked]:bg-highlight data-[state=checked]:font-semibold data-[state=checked]:text-primary'
                >
                  {caseOption.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <label
            htmlFor='checklistRequirementId'
            className='font-sans text-xs text-muted-foreground'
          >
            Item do checklist
          </label>
          <Select
            value={checklistRequirementId || undefined}
            onValueChange={handleChecklistSelect}
            disabled={isChecklistDisabled || !caseId || isLoadingChecklist}
          >
            <SelectTrigger
              id='checklistRequirementId'
              className='h-12 w-full rounded-xl border-border bg-card px-4 font-sans text-sm font-medium shadow-sm hover:border-primary/50 hover:bg-highlight/30 focus:ring-primary/20 disabled:bg-muted/40'
            >
              <SelectValue
                placeholder={
                  !caseId
                    ? 'Selecione o caso primeiro'
                    : isLoadingChecklist
                      ? 'Carregando checklist...'
                      : 'Selecionar item'
                }
              />
            </SelectTrigger>
            <SelectContent
              position='popper'
              align='start'
              className='max-h-72 min-w-[var(--radix-select-trigger-width)] rounded-xl border border-border bg-card p-1.5 shadow-lg ring-0'
            >
              {checklistOptions.map((checklistItem) => (
                <SelectItem
                  key={checklistItem.id}
                  value={checklistItem.id}
                  className='min-h-10 rounded-lg px-3 py-2 font-sans text-sm text-foreground focus:bg-highlight focus:text-foreground data-[state=checked]:bg-highlight data-[state=checked]:font-semibold data-[state=checked]:text-primary'
                >
                  {checklistItem.title}
                </SelectItem>
              ))}
              {checklistRequirementId &&
                checklistOptions.every(
                  (checklistItem) => checklistItem.id !== checklistRequirementId,
                ) && (
                  <SelectItem
                    value={checklistRequirementId}
                    className='min-h-10 rounded-lg px-3 py-2 font-sans text-sm text-foreground focus:bg-highlight focus:text-foreground data-[state=checked]:bg-highlight data-[state=checked]:font-semibold data-[state=checked]:text-primary'
                  >
                    {checklistItemLabel || checklistRequirementId}
                  </SelectItem>
                )}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  )
}
