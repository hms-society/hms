import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type ConsultationDocumentReviewErrorStateProps = {
  forbidden?: boolean
  notFound?: boolean
  onBack: () => void
  onRetry: () => void
}

export const ConsultationDocumentReviewErrorState = ({
  forbidden = false,
  notFound = false,
  onBack,
  onRetry,
}: ConsultationDocumentReviewErrorStateProps) => (
  <main className='mx-auto flex w-full max-w-3xl flex-col items-center gap-4 py-16 text-center'>
    <span className='flex size-12 items-center justify-center rounded-xl bg-muted text-primary'>
      <Icon name={forbidden ? 'shield-check' : 'file-text'} />
    </span>
    <h1 className='font-serif text-2xl font-semibold'>
      {forbidden
        ? 'Acesso negado'
        : notFound
          ? 'Versão não encontrada'
          : 'Não foi possível carregar a revisão'}
    </h1>
    <p className='max-w-lg text-sm text-muted-foreground'>
      {forbidden
        ? 'Você não tem acesso a este documento nesta consulta.'
        : notFound
          ? 'A consulta, o documento ou a versão não está disponível. Retorne à área documental.'
          : 'Tente novamente ou retorne à área documental.'}
    </p>
    <div className='flex flex-wrap justify-center gap-2'>
      {!forbidden && !notFound && (
        <Button type='button' variant='outline' onClick={onRetry}>
          <Icon name='refresh-cw' /> Tentar novamente
        </Button>
      )}
      <Button type='button' variant='brand' onClick={onBack}>
        <Icon name='arrow-left' /> Voltar aos documentos
      </Button>
    </div>
  </main>
)
