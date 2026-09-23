import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { DocumentEditor } from '@/ui/document-production/widgets/components/document-editor'
import { Button } from '@/ui/shadcn/button'

import {
  PieceWorkflowDialog,
  ReviewActionDialog,
} from './my-case-page/case-pieces-tab/piece-workflow-dialog'

type PieceWorkflowRoutePageProps = {
  mode: 'editor' | 'review'
  caseId: string
  documentId: string
}

export function PieceWorkflowRoutePage({
  mode,
  caseId,
  documentId,
}: PieceWorkflowRoutePageProps) {
  const navigate = useNavigate()
  const { caseDocumentProductionService } = useRestContext()
  const documentQuery = useQuery({
    queryKey: ['case-document', caseId, documentId],
    queryFn: () => caseDocumentProductionService.getDocument(caseId, documentId),
  })
  const [reviewAction, setReviewAction] = useState<'adjustments' | 'block' | null>(null)
  const document = documentQuery.data?.body
  const version = document?.versions.find((item) => item.id === document.currentVersionId) ?? document?.versions.at(-1)

  if (documentQuery.isLoading) return <div className='flex min-h-screen items-center justify-center text-muted-foreground'>Carregando documento...</div>
  if (documentQuery.isError || !document || !version?.content) return <div className='flex min-h-screen items-center justify-center text-muted-foreground'>Não foi possível carregar o conteúdo desta peça.</div>

  if (mode === 'review') {
    return <main className='min-h-screen bg-muted/50 p-8'><header className='mx-auto mb-4 flex max-w-[900px] items-center justify-between rounded-xl border bg-card p-4'><div><p className='text-xs text-muted-foreground'>Peça · Versão {version.versionNumber}</p><h1 className='font-serif text-xl font-semibold'>{document.title}</h1></div><Button variant='ghost' size='icon' aria-label='Voltar' onClick={() => navigate({ to: '/advogado/meus-casos/$caseId/pecas/$documentId', params: { caseId, documentId } })}><Icon name='x' /></Button></header><section className='mx-auto max-w-[900px] overflow-hidden rounded-xl border bg-card'><DocumentEditor content={version.content} onChange={() => undefined} ariaLabel={`Conteúdo da versão ${version.versionNumber}`} editable={false} /></section></main>
  }

  return (
    <>
      <PieceWorkflowDialog
        mode={mode}
        open
        onOpenChange={(open) =>
          !open &&
          navigate({
            to: '/advogado/meus-casos/$caseId/pecas/$documentId',
            params: { caseId, documentId },
          })
        }
        onRequestAdjustments={() => setReviewAction('adjustments')}
        onBlock={() => setReviewAction('block')}
      />
      {reviewAction ? (
        <ReviewActionDialog
          kind={reviewAction}
          open
          onOpenChange={(open) => !open && setReviewAction(null)}
        />
      ) : null}
    </>
  )
}
