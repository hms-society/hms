import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Icon } from '@/ui/shared/widgets/components/icon'

import { CasePieceCard } from './case-piece-card'
import { DossierGateBanner } from './dossier-gate-banner'
import { NewCasePieceCard } from './new-case-piece-card'
import { NewPieceDialog } from './new-piece-dialog'
import { PieceViewerDialog } from './piece-viewer-dialog'
import { PieceWorkflowDialog, ReviewActionDialog } from './piece-workflow-dialog'
import type { CaseDocumentResponse } from '@/rest/services/case-document-production-service'
import type { CasePiece } from './types'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type CasePiecesTabProps = {
  dossierApproved: boolean
  caseId?: string
}

export function CasePiecesTab({ dossierApproved, caseId }: CasePiecesTabProps) {
  const queryClient = useQueryClient()
  const { navigateTo } = useNavigation()
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
        author: 'Solicitante atual',
        reviewer: document.versions.length ? 'Aguardando revisão humana' : '—',
        updatedAt: formatDate(document.versions[0]?.createdAt),
        status:
          document.generation?.status === 'pending' ||
          document.generation?.status === 'running'
            ? 'Gerando minuta'
            : document.generation?.status === 'failed' ||
                document.generation?.status === 'cancelled'
              ? 'Falha na geração'
              : document.versions[0]?.status === 'approved'
                ? 'Aprovada'
                : 'Em revisão técnica',
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
    refetchInterval: (query) =>
      query.state.data?.some((piece) => piece.status === 'Gerando minuta') ? 3000 : false,
  })
  const retryMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!caseId) throw new Error('Caso não identificado.')
      const response = await caseDocumentProductionService.retryGeneration(
        caseId,
        documentId,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (result) => {
      queryClient.setQueryData<CaseDocumentResponse[]>(
        ['case-documents', caseId],
        (current) =>
          current?.map((document) =>
            document.id === result.documentId
              ? {
                  ...document,
                  generation: { id: result.documentGenerationId, status: 'pending' },
                }
              : document,
          ),
      )
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
          {isLoading ? (
            <p className='rounded-md border border-border p-4 text-sm text-muted-foreground'>
              Carregando peças...
            </p>
          ) : null}
          {!isLoading && pieces.length === 0 ? (
            <p className='rounded-md border border-dashed border-border p-6 text-sm text-muted-foreground'>
              Nenhuma peça foi adicionada a este caso.
            </p>
          ) : null}
          {pieces.map((piece) => (
            <CasePieceCard
              key={piece.id}
              piece={piece}
              onRetry={() => retryMutation.mutate(piece.id)}
              isRetrying={retryMutation.isPending && retryMutation.variables === piece.id}
              retryError={
                retryMutation.isError && retryMutation.variables === piece.id
                  ? retryMutation.error.message
                  : undefined
              }
              onOpenReview={() => {
                if (caseId) {
                  void navigateTo('lawyerCasePieceReview', {
                    params: { caseId, documentId: piece.id },
                  })
                  return
                }
                setIsViewerOpen(true)
              }}
              onOpenEditor={() => {
                if (caseId) {
                  void navigateTo('lawyerCasePieceEditor', {
                    params: { caseId, documentId: piece.id },
                  })
                  return
                }
                setWorkflow('editor')
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
        caseId={caseId}
        onOpenChange={setIsNewPieceOpen}
        onGenerated={() => {
          if (caseId) {
            void queryClient.invalidateQueries({ queryKey: ['case-documents', caseId] })
          }
        }}
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
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatVersionStatus(status: string) {
  return (
    {
      approved: 'Aprovada',
      in_review: 'Em revisão',
      rejected: 'Rejeitada',
      generating: 'Gerando',
      generation_failed: 'Falha na geração',
    }[status] ?? status
  )
}
