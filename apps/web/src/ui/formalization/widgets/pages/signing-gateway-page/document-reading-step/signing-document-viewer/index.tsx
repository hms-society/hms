import { Button } from '@/ui/shadcn/button'
import { useSigningDocumentViewer } from './use-signing-document-viewer'

export type { SigningDocumentViewerProps } from './use-signing-document-viewer'
import type { SigningDocumentViewerProps } from './use-signing-document-viewer'

export const SigningDocumentViewer = (props: SigningDocumentViewerProps) => {
  const { currentPage, objectUrl } = useSigningDocumentViewer(props)
  if (props.isLoading)
    return (
      <div role='status' aria-live='polite'>
        Carregando documento…
      </div>
    )
  if (props.error)
    return (
      <div role='alert'>
        <p>Não foi possível carregar o documento privado.</p>
        <Button variant='outline' onClick={props.onRetry}>
          Tentar novamente
        </Button>
      </div>
    )
  if (!objectUrl) return <div role='status'>Documento indisponível.</div>
  return (
    <section
      aria-label={`Visualizador de ${props.title}`}
      className='flex flex-col gap-2 overflow-auto rounded-md border border-border p-2'
      data-document-id={props.documentId}
    >
      <div aria-live='polite'>
        <span>
          Página {currentPage} de {props.pageCount ?? '—'}
        </span>
      </div>
      <iframe className='h-[36rem] min-h-96 w-full' title={props.title} src={objectUrl} />
    </section>
  )
}
