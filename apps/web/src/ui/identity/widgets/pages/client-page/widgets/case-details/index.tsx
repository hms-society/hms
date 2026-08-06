import { useCaseDetails } from './use-case-details'
import { Card } from '@/ui/shadcn/card'
import { Button } from '@/ui/shadcn/button'
import { TopDetails } from './top-details'
import { MidDetails } from './mid-details'
import { BottomDetails } from './bottom-details'

export const CaseDetails = () => {
  const { error, caseDetails } = useCaseDetails()

  if (error || !caseDetails) {
    return (
      <div className='flex items-center justify-center p-8 flex-1'>
        <Card className='p-8 text-center max-w-md border-destructive/20 bg-destructive/5 text-destructive'>
          <h2 className='text-xl font-bold mb-2'>Erro ao carregar detalhes</h2>
          <p className='mb-4'>
            Não foi possível recuperar os dados do seu caso. Por favor, tente novamente.
          </p>
          <Button onClick={() => window.location.reload()}>Recarregar Página</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-8 w-full max-w-none flex-1 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <TopDetails />
      <MidDetails />
      <BottomDetails />
    </div>
  )
}
