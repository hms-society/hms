import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { IntakeStatus } from '@hms/core/intake/domain/structures'

import { useConsultation } from '@/ui/consultation/hooks/use-consultation'
import { useConsultationDocumentSelectionQuery } from '@/ui/document-production/hooks/use-consultation-document-selection-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { ConfirmConsultationCompletionDialog } from '../../components/confirm-consultation-completion-dialog'
import { ConsultationTabs } from './consultation-tabs'
import { ConsultationPagePrimaryAction } from './consultation-page-primary-action'
import { useConsultationPageAction } from './consultation-page-action-context'
import { useConsultationPage } from './use-consultation-page'

export type ConsultationPageProps = {
  consultationId: string
  children: ReactNode
}

export const ConsultationPage = ({ consultationId, children }: ConsultationPageProps) => {
  const { activeTab } = useConsultationPage()
  const { consultation, completeConsultation, isCompleting, completeConsultationError } =
    useConsultation(consultationId)
  const { data: documentSelection } = useConsultationDocumentSelectionQuery(
    consultationId,
    {
      enabled: Boolean(consultation?.attendanceFinalizedAt),
    },
  )
  const { registerPrimaryAction } = useConsultationPageAction()
  const { navigateTo } = useNavigation()
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false)
  const completeConsultationRef = useRef(completeConsultation)
  const navigateToRef = useRef(navigateTo)
  completeConsultationRef.current = completeConsultation
  navigateToRef.current = navigateTo
  const isAttendanceFinalized = Boolean(consultation?.attendanceFinalizedAt)
  const isIntakeClosedWithoutContract =
    consultation?.intake?.status === IntakeStatus.ClosedWithoutContract
  const isPackageConfirmed = Boolean(documentSelection?.confirmedAt)
  const canCompleteConsultation = isAttendanceFinalized && isPackageConfirmed
  const isConsultationPending = consultation?.status === 'pending'
  const isConsultationCompleted = consultation?.status === 'completed'
  const hasConsultation = Boolean(consultation)
  const handleOpenCompletionDialog = useCallback(() => {
    setIsCompletionDialogOpen(true)
  }, [])

  const handleCompleteConsultation = useCallback(async () => {
    await completeConsultationRef.current()
    if (consultation?.intakeId) {
      await navigateToRef.current('intakeDetails', {
        params: { intakeId: consultation.intakeId },
      })
    }
  }, [consultation?.intakeId])

  useEffect(
    function registerCompleteConsultationAction() {
      if (!hasConsultation) {
        registerPrimaryAction(null)
        return
      }

      registerPrimaryAction({
        onClick: handleOpenCompletionDialog,
        isPending: isCompleting,
        label: isConsultationCompleted ? 'Consulta finalizada' : undefined,
        isDisabled:
          isConsultationCompleted || !isConsultationPending || !canCompleteConsultation,
        disabledReason: isConsultationCompleted
          ? 'A consulta já foi finalizada.'
          : !isConsultationPending
            ? 'A consulta não está pendente.'
            : !isAttendanceFinalized
              ? 'Finalize a ficha de atendimento primeiro.'
              : 'Confirme o pacote de documentos primeiro.',
      })

      return function unregisterCompleteConsultationAction() {
        registerPrimaryAction(null)
      }
    },
    [
      canCompleteConsultation,
      hasConsultation,
      handleOpenCompletionDialog,
      isAttendanceFinalized,
      isConsultationCompleted,
      isCompleting,
      isConsultationPending,
      registerPrimaryAction,
    ],
  )

  return (
    <div className='w-full mx-auto px-4 sm:px-8 py-6 space-y-8 font-sans'>
      <ConsultationPagePrimaryAction />
      <ConfirmConsultationCompletionDialog
        open={isCompletionDialogOpen}
        isConfirming={isCompleting}
        error={completeConsultationError}
        onOpenChange={setIsCompletionDialogOpen}
        onConfirm={handleCompleteConsultation}
      />
      <ConsultationTabs
        consultationId={consultationId}
        activeTab={activeTab}
        isDocumentsEnabled={isAttendanceFinalized && !isIntakeClosedWithoutContract}
        isDocumentsClosedWithoutContract={isIntakeClosedWithoutContract}
      />
      {children}
    </div>
  )
}

export const ConsultationIndexPage = () => (
  <div className='mx-auto flex min-h-[50vh] w-full max-w-3xl items-center justify-center px-4 py-12 sm:px-8'>
    <div className='w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm'>
      <h1 className='font-serif text-2xl text-foreground'>Consulta</h1>
      <p className='mt-2 text-sm text-muted-foreground'>
        Abra uma consulta usando o endereço que contém o ID da consulta.
      </p>
    </div>
  </div>
)
