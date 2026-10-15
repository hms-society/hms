import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

export const CreateCasePageHeading = () => (
  <div className='mb-2 flex items-start gap-3 sm:mb-4'>
    <Anchor
      route='lawyerCases'
      className='mt-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
    >
      <Icon name='arrow-left' className='size-5' />
    </Anchor>
    <div className='flex flex-col text-left'>
      <h1 className='font-serif text-[24px] font-semibold text-teal-900 sm:text-[28px]'>
        Novo Caso
      </h1>
      <p className='text-[13px] text-muted-foreground sm:text-[14px]'>
        Preencha os detalhes e defina a equipe para abrir um novo dossiê.
      </p>
    </div>
  </div>
)
