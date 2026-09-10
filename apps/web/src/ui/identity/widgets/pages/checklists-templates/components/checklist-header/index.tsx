import { Check } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'

type ChecklistHeaderProps = {
  onSave: () => void
}

export function ChecklistHeader({ onSave }: ChecklistHeaderProps) {
  return (
    <header className='flex flex-col gap-1 md:flex-row md:items-start md:justify-between'>
      <div className='flex flex-col gap-1'>
        <h1 className='font-serif text-[30px] font-bold leading-tight text-primary'>
          Modelos de Checklist por Área do Direito
        </h1>

        <p className='max-w-[720px] text-[15px] leading-5 text-muted-foreground'>
          Defina os documentos obrigatórios que serão instanciados
          automaticamente na abertura de novos casos por área do direito.
        </p>
      </div>

      <Button
        type='button'
        variant='brand'
        className='mt-1 rounded-pill px-5'
        onClick={onSave}
      >
        Salvar Template de Checklist
        <Check className='size-4' />
      </Button>
    </header>
  )
}
