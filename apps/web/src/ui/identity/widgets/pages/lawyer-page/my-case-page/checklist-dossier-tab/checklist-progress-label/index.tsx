export type ChecklistProgressLabelProps = {
  mandatoryItemsCount: number
  progress: number
  validatedItemsCount: number
}

export const ChecklistProgressLabel = ({
  mandatoryItemsCount,
  progress,
  validatedItemsCount,
}: ChecklistProgressLabelProps) => (
  <span className='text-[14px] font-semibold text-foreground'>
    {validatedItemsCount} de {mandatoryItemsCount} obrigatórios - {progress}%
  </span>
)
