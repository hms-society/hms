import { DialogDescription, DialogHeader, DialogTitle } from '@/ui/shadcn/dialog'

export const SelectorDialogHeading = () => (
  <DialogHeader>
    <DialogTitle className='font-serif text-xl'>Selecionar colaborador</DialogTitle>
    <DialogDescription>
      Busque pelo nome, filtre o perfil e escolha uma pessoa ativa para a equipe.
    </DialogDescription>
  </DialogHeader>
)
