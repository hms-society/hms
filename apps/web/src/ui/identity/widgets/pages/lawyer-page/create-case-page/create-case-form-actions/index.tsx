import { Button } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

export type CreateCaseFormActionsProps = {
  isCreating: boolean
  canCreate: boolean
}

export const CreateCaseFormActions = ({
  isCreating,
  canCreate,
}: CreateCaseFormActionsProps) => (
  <div className='flex flex-col-reverse items-center justify-end gap-3 pt-4 sm:flex-row sm:gap-6'>
    <Anchor route='lawyerCases' className='w-full sm:w-auto'>
      <Button
        type='button'
        variant='ghost'
        className='w-full rounded-full px-6 py-2 font-medium hover:bg-muted sm:w-auto'
      >
        Cancelar
      </Button>
    </Anchor>
    <Button
      type='submit'
      disabled={isCreating || !canCreate}
      className='w-full rounded-full bg-primary px-8 py-2 text-primary-foreground hover:bg-primary/90 sm:w-auto'
    >
      {isCreating ? 'Criando...' : 'Criar Caso'}
    </Button>
  </div>
)
