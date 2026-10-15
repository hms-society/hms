export const CaseFactsCard = () => (
  <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-4 shadow-xs'>
    <h2 className='font-serif text-[16px] font-semibold text-foreground'>
      Dados do Caso
    </h2>
    <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[14px]'>
      <dt className='text-muted-foreground'>Contratação</dt>
      <dd className='font-semibold text-foreground'>CONT-20260701-0113</dd>
      <dt className='text-muted-foreground'>Tipo de serviço</dt>
      <dd className='font-semibold text-foreground'>Processo administrativo INSS</dd>
      <dt className='text-muted-foreground'>Abertura</dt>
      <dd className='font-semibold text-foreground'>03/07/2026</dd>
      <dt className='text-muted-foreground'>Origem</dt>
      <dd className='font-semibold text-foreground'>Intake #INT-2026-0457</dd>
      <dt className='text-muted-foreground'>Cliente desde</dt>
      <dd className='font-semibold text-foreground'>01/07/2026</dd>
    </dl>
  </section>
)
