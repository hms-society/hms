import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { Icon } from '@/ui/shared/widgets/components/icon'

import { CasePieceCard } from './case-piece-card'
import { DossierGateBanner } from './dossier-gate-banner'
import { NewCasePieceCard } from './new-case-piece-card'
import { NewPieceDialog } from './new-piece-dialog'
import { PieceViewerDialog } from './piece-viewer-dialog'
import { PieceWorkflowDialog, ReviewActionDialog } from './piece-workflow-dialog'
import type { CasePiece } from './types'

export type CasePiecesTabProps = {
  dossierApproved: boolean
  caseId?: string
}

const MOCK_PIECES: CasePiece[] = [
  {
    id: 'requerimento-administrativo',
    title: 'Requerimento Administrativo — Aposentadoria por Tempo de Contribuição',
    template: 'Requerimento INSS v2',
    author: 'Mariana Costa',
    reviewer: 'Dr. Ricardo Mendes',
    updatedAt: '10:12',
    status: 'Em revisão técnica',
    versions: [
      {
        id: 'v3',
        label: 'v3',
        title: 'Submetida para revisão técnica',
        author: 'Mariana Costa',
        timestamp: 'hoje, 10:12',
      },
      {
        id: 'v2',
        label: 'v2',
        title: 'Ajustes na fundamentação e períodos contributivos',
        author: 'Mariana Costa',
        timestamp: 'ontem, 17:40',
      },
      {
        id: 'v1',
        label: 'v1',
        title: 'Minuta inicial gerada com IA a partir do dossiê',
        author: 'Sistema',
        timestamp: '14/07, 15:05',
        meta: 'confiança 94%',
      },
    ],
  },
]

export function CasePiecesTab({ dossierApproved, caseId }: CasePiecesTabProps) {
  const navigate = useNavigate()
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
          {MOCK_PIECES.map((piece) => (
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
