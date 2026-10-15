import { Icon } from '@/ui/shared/widgets/components/icon'

export const TeamAccessLegend = () => (
  <aside className='overflow-hidden rounded-xl border border-border bg-card'>
    <header className='border-b border-border px-4 py-3'>
      <h3 className='font-serif text-base font-semibold text-foreground'>
        Níveis de acesso
      </h3>
    </header>
    <div className='divide-y divide-border'>
      <div className='flex gap-3 p-4'>
        <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground'>
          <Icon name='shield-check' className='size-4' />
        </span>
        <div>
          <p className='text-sm font-medium text-foreground'>Gestor</p>
          <p className='text-xs text-muted-foreground'>
            Opera o Caso e também administra a equipe.
          </p>
        </div>
      </div>
      <div className='flex gap-3 p-4'>
        <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground'>
          <Icon name='user' className='size-4' />
        </span>
        <div>
          <p className='text-sm font-medium text-foreground'>Colaborador</p>
          <p className='text-xs text-muted-foreground'>
            Opera documentos, tarefas, prazos e demais atividades.
          </p>
        </div>
      </div>
      <p className='flex gap-2 bg-highlight px-4 py-3 text-xs text-highlight-foreground'>
        <Icon name='info' className='size-4 shrink-0' /> Pelo menos uma pessoa deve
        permanecer como Gestora.
      </p>
    </div>
  </aside>
)
