import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

import { Icon } from '@/ui/shared/widgets/components/icon'

import { CasePieceCard } from './case-piece-card'
import { DossierGateBanner } from './dossier-gate-banner'
import { NewCasePieceCard } from './new-case-piece-card'
import { NewPieceDialog } from './new-piece-dialog'
import { PieceViewerDialog } from './piece-viewer-dialog'
import { PieceWorkflowDialog, ReviewActionDialog } from './piece-workflow-dialog'
import type { CasePiece } from './types'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export type CasePiecesTabProps = {
  dossierApproved: boolean
  caseId?: string
}

export function CasePiecesTab({ dossierApproved, caseId }: CasePiecesTabProps) {
  const navigate = useNavigate()
  const { caseDocumentProductionService } = useRestContext()
  const { data: pieces = [], isLoading } = useQuery({
    queryKey: ['case-documents', caseId],
    enabled: dossierApproved && Boolean(caseId),
    queryFn: async () => {
      if (!caseId) return []
      const response = await caseDocumentProductionService.listDocuments(caseId)
      if (response.isFailure) response.throwError()
      return response.body.map<CasePiece>((document) => ({
        id: document.id,
        title: document.title,
        template: 'Modelo documental',
        author: 'Colaborador do caso',
        reviewer: 'Revisor do caso',
        updatedAt: formatDate(document.versions[0]?.createdAt),
        status: document.versions[0]?.status === 'approved' ? 'Aprovada' : 'Em revisão técnica',
        versions: document.versions.map((version) => ({
          id: version.id,
          label: `v${version.versionNumber}`,
          title: formatVersionStatus(version.status),
          author: 'Colaborador responsável',
          timestamp: formatDate(version.createdAt),
          meta: version.rejectionReason,
        })),
      }))
    },
  })
  const [isNewPieceOpen, setIsNewPieceOpen] = useState(false)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [workflow, setWorkflow] = useState<'editor' | 'review' | null>(null)
  const [reviewAction, setReviewAction] = useState<
    'adjustments' | 'block' | 'approval' | null
  >(null)
  return (
    <div className='flex flex-col gap-4'>
      <div>
        <h2 className='font-serif text-xl font-semibold text-foreground'>
          Produção Jurídica
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Elaboração, revisão e histórico das peças deste caso.
        </p>
      </div>
      <DossierGateBanner approved={dossierApproved} />
      {dossierApproved ? (
        <>
          {isLoading ? <p className='rounded-md border border-border p-4 text-sm text-muted-foreground'>Carregando peças...</p> : null}
          {!isLoading && pieces.length === 0 ? <p className='rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground'>Nenhuma peça foi adicionada a este caso.</p> : null}
          {pieces.map((piece) => (
            <CasePieceCard
              key={piece.id}
              piece={piece}
              onOpenViewer={() => {
                if (caseId) {
                  navigate({
                    to: '/advogado/meus-casos/$caseId/pecas/$documentId',
                    params: { caseId, documentId: piece.id },
                  })
                  return
                }
                setIsViewerOpen(true)
              }}
            />
          ))}
          <NewCasePieceCard onOpen={() => setIsNewPieceOpen(true)} />
          <p className='flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground'>
            <Icon name='shield-check' className='mt-0.5 size-3.5 shrink-0 text-primary' />
            A IA gera e sugere minutas, mas nenhuma peça é protocolada ou entregue sem
            revisão e aprovação humana registrada.
          </p>
        </>
      ) : null}
      <NewPieceDialog
        open={isNewPieceOpen}
        onOpenChange={setIsNewPieceOpen}
        onGenerated={() => setIsViewerOpen(true)}
      />
      <PieceViewerDialog
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        onOpenEditor={() => {
          setIsViewerOpen(false)
          setWorkflow('editor')
        }}
        onOpenReview={() => {
          setIsViewerOpen(false)
          setWorkflow('review')
        }}
      />
      <PieceWorkflowDialog
        mode={workflow ?? 'editor'}
        open={workflow !== null}
        onOpenChange={(open) => !open && setWorkflow(null)}
        onRequestAdjustments={() => setReviewAction('adjustments')}
        onBlock={() => setReviewAction('block')}
      />
      <ReviewActionDialog
        kind={reviewAction ?? 'adjustments'}
        open={reviewAction !== null}
        onOpenChange={(open) => !open && setReviewAction(null)}
      />
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function formatVersionStatus(status: string) {
  return { approved: 'Aprovada', in_review: 'Em revisão', rejected: 'Rejeitada', generating: 'Gerando', generation_failed: 'Falha na geração' }[status] ?? status
}
