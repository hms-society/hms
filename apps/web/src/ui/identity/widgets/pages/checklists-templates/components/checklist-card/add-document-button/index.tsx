import { Plus } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'

type AddDocumentButtonProps = {
  onClick: () => void
}

export function AddDocumentButton({ onClick }: AddDocumentButtonProps) {
  return (
    <Button
      type='button'
      variant='outline'
      className='h-10 rounded-pill border-primary text-primary hover:bg-primary/5'
      onClick={onClick}
    >
      <Plus className='size-4' />
      Adicionar Documento
    </Button>
  )
}
