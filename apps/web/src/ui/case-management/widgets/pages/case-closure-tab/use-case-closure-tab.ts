import { useState } from 'react'

export type UseCaseClosureTabProps = {
  canManage: boolean
}

export const CLOSURE_OUTCOMES = [
  'Favorável',
  'Parcialmente favorável',
  'Desfavorável',
  'Acordo homologado',
  'Produto/orientação entregue',
  'Desistência/cancelamento',
  'Perda de objeto',
  'Outro',
] as const

export function useCaseClosureTab({ canManage }: UseCaseClosureTabProps) {
  const [isFinancialSettlementPending, setIsFinancialSettlementPending] = useState(false)
  const [isSettlementComplete, setIsSettlementComplete] = useState(false)
  const [isArchiveComplete, setIsArchiveComplete] = useState(false)
  const [isNewDemandCreated, setIsNewDemandCreated] = useState(false)
  const [isConcluded, setIsConcluded] = useState(false)
  const [isOutcomeEditorOpen, setOutcomeEditorOpen] = useState(false)
  const [outcome, setOutcome] =
    useState<(typeof CLOSURE_OUTCOMES)[number]>('Acordo homologado')
  const [outcomeSummary, setOutcomeSummary] = useState(
    'Acordo homologado judicialmente entre o cliente e o INSS na audiência de conciliação de 14/07. INSS reconheceu o direito à aposentadoria por tempo de contribuição com DIB retroativa à DER (03/07/2026). Valor de retroativos: R$ 42.860,00 a ser depositado em conta judicial em até 30 dias.',
  )

  const completedSteps = 1 + Number(isSettlementComplete) + Number(isArchiveComplete)
  const isReadOnly = !canManage || isConcluded
  const canConclude = canManage && !isConcluded && completedSteps === 3

  function handleStartSettlement() {
    if (isReadOnly) return
    setIsFinancialSettlementPending(true)
  }

  function handleConfirmSettlement() {
    if (isReadOnly) return
    setIsSettlementComplete(true)
    setIsFinancialSettlementPending(false)
  }

  function handleMarkNoSettlement() {
    if (isReadOnly) return
    setIsSettlementComplete(true)
    setIsFinancialSettlementPending(false)
  }

  function handleArchiveDocuments() {
    if (isReadOnly) return
    setIsArchiveComplete(true)
  }

  function handleConclude() {
    if (!canConclude) return
    setIsConcluded(true)
  }

  function handleOpenOutcomeEditor() {
    if (isReadOnly) return
    setOutcomeEditorOpen(true)
  }

  function handleCreateNewDemand() {
    if (isReadOnly) return
    setIsNewDemandCreated(true)
  }

  function handleSaveOutcome() {
    if (isReadOnly || !outcomeSummary.trim()) return
    setOutcomeEditorOpen(false)
  }

  return {
    canConclude,
    canManage,
    completedSteps,
    isConcluded,
    isFinancialSettlementPending,
    isReadOnly,
    isSettlementComplete,
    isArchiveComplete,
    isNewDemandCreated,
    outcome,
    outcomeSummary,
    isOutcomeEditorOpen,
    setOutcomeEditorOpen,
    setOutcome,
    setOutcomeSummary,
    handleArchiveDocuments,
    handleConfirmSettlement,
    handleConclude,
    handleCreateNewDemand,
    handleMarkNoSettlement,
    handleOpenOutcomeEditor,
    handleSaveOutcome,
    handleStartSettlement,
  }
}
