import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { PieceFilePreview } from './piece-file-preview'

type PieceViewerPageProps = {
  caseId: string
  documentId: string
  onClose: () => void
  onOpenEditor: () => void
  onOpenReview: () => void
}

export function PieceViewerPage({
  caseId,
  documentId,
  onClose,
  onOpenEditor,
  onOpenReview,
}: PieceViewerPageProps) {
  const { caseDocumentProductionService, caseManagementService } = useRestContext()
  const documentQuery = useQuery({
    queryKey: ['case-document', caseId, documentId],
    queryFn: () => caseDocumentProductionService.getDocument(caseId, documentId),
  })
  const caseQuery = useQuery({
    queryKey: ['case-details', caseId],
    queryFn: async () => {
      const response = await caseManagementService.getLegalCaseDetails(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
  const document = documentQuery.data?.body
  const currentVersion = document?.versions.reduce<
    (typeof document.versions)[number] | undefined
  >(
    (latest, candidate) =>
      !latest || candidate.versionNumber > latest.versionNumber ? candidate : latest,
    undefined,
  )

  if (documentQuery.isLoading)
    return (
      <div className='flex min-h-screen items-center justify-center text-muted-foreground'>
        Carregando documento...
      </div>
    )
  if (documentQuery.isError || !document)
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-4 text-muted-foreground'>
        <p>Documento não encontrado para este caso.</p>
        <Button variant='outline' onClick={onClose}>
          Voltar para meus casos
        </Button>
      </div>
    )

  return (
    <div className='flex min-h-[calc(100vh-5rem)] flex-col bg-muted/50'>
      <header className='flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4'>
        <div className='min-w-0'>
          <p className='text-xs text-muted-foreground'>
            Caso {caseQuery.data?.publicCode ?? '…'} · Peças · {document.title}
          </p>
          <div className='mt-1 flex flex-wrap items-center gap-3'>
            <h1 className='font-serif text-xl font-semibold'>{document.title}</h1>
            <Badge variant='success'>
              {currentVersion
                ? `v${currentVersion.versionNumber} · Versão atual`
                : 'Não gerado'}
            </Badge>
          </div>
          <p className='mt-1 text-xs text-muted-foreground'>
            {currentVersion
              ? `Versão ${currentVersion.versionNumber} · ${currentVersion.source === 'ai' ? 'Gerada com IA' : 'Editada manualmente'}`
              : 'Nenhuma versão gerada'}
          </p>
        </div>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Voltar para meus casos'
          onClick={onClose}
        >
          <Icon name='x' />
        </Button>
      </header>
      <main className='min-w-0 max-w-full flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-8'>
        <section className='mx-auto max-w-[900px] overflow-hidden rounded-xl border bg-card shadow-sm'>
          {currentVersion ? (
            <PieceFilePreview
              caseId={caseId}
              documentId={documentId}
              versionId={currentVersion.id}
              storagePath={currentVersion.storagePath}
              versionNumber={currentVersion.versionNumber}
            />
          ) : (
            <p className='p-8 text-sm text-muted-foreground'>
              Esta peça ainda não possui uma versão.
            </p>
          )}
        </section>
      </main>
      <footer className='flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-4 py-4 sm:px-6'>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={onOpenEditor}>
            <Icon name='pencil' /> Abrir no editor
          </Button>
          <Button size='sm' onClick={onOpenReview}>
            <Icon name='eye' /> Abrir revisão técnica
          </Button>
        </div>
      </footer>
    </div>
  )
}
