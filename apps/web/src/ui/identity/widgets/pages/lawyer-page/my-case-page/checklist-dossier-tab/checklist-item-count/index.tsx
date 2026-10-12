export type ChecklistItemCountProps = { count: number }

export const ChecklistItemCount = ({ count }: ChecklistItemCountProps) => (
  <p className='text-[14px] text-muted-foreground'>
    {count > 0
      ? `${count} item(ns) obrigatório(s) carregado(s) do checklist do caso`
      : 'Nenhum checklist documental foi encontrado para este caso'}
  </p>
)
