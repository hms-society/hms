import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

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
  const [reviewAction, setReviewAction] = useState<'adjustments' | 'block' | null>(null)

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
