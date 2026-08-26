import { useState } from 'react'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'

import {
  DocumentPackage,
  type DocumentPackageItem,
} from '@/ui/document-production/widgets/components/document-package'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { SelectFormDialog } from '@/ui/shared/widgets/dynamic-form/select-form'

import { CommercialConditionsCard } from './commercial-conditions-card'
import { CloseWithoutContractDialog } from './close-without-contract-dialog'
import { DocumentPackageConfirmationDialog } from './document-package-confirmation-dialog'
import { FormalizationContextHeader } from './formalization-context-header'
import { FormalizationSendingConfiguration } from './formalization-sending-configuration'
import {
  FormalizationLoadingPanel,
  FormalizationStatePanel,
} from './formalization-state-panels'
import { SelectFormalizationDocumentsDialog } from './select-formalization-documents-dialog'
import { useFormalizationPage } from './use-formalization-page'

export const FormalizationPage = ({ formalizationId }: { formalizationId: string }) => {
  const page = useFormalizationPage(formalizationId)

  if (page.query.isLoading) return <FormalizationLoadingPanel />
  if (page.query.isError || !page.query.data) {
    return (
      <FormalizationStatePanel
        title='Não foi possível carregar a formalização'
        description='Verifique o acesso e tente novamente.'
        onRetry={() => void page.query.refetch()}
      />
    )
  }

  const data = page.query.data
  const { formalization } = data
  const isTerminal = formalization.status !== 'in_progress'
  const fields = formalization.contractFormSnapshot.fields
  const formError =
    page.actions.saveDraft.error ??
    page.actions.closeForm.error ??
    page.actions.reopenForm.error ??
    page.actions.replaceForm.error

  return (
    <main className='flex w-full flex-col gap-5 pb-10'>
      <div className='flex flex-col gap-3'>
        <Button asChild variant='link' className='h-auto w-fit px-0 text-primary'>
          <Anchor route='intakeDetails' params={{ intakeId: data.intake.id }}>
            <Icon name='arrow-left' className='size-4' />
            Voltar para o Intake
          </Anchor>
        </Button>
        <FormalizationContextHeader data={data} />
      </div>
      <CommercialConditionsCard
        fields={fields}
        answers={page.effectiveAnswers}
        isClosed={formalization.contractFormState === 'closed'}
        isReadOnly={isTerminal}
        error={formError}
        isPending={
          page.actions.saveDraft.isPending ||
          page.actions.closeForm.isPending ||
          page.actions.reopenForm.isPending ||
          page.actions.replaceForm.isPending
        }
        formName={formalization.contractFormSnapshot.name}
        onOpenSelect={() => page.setIsFormSelectionOpen(true)}
        canReplace={!isTerminal && formalization.contractFormState === 'open'}
        expectedVersion={formalization.version}
        onChange={page.setAnswer}
        onSaveDraft={(expectedVersion, answers) =>
          page.actions.saveDraft.mutate({ expectedVersion, answers })
        }
        onClose={(expectedVersion, answers) =>
          page.actions.closeForm.mutate({ expectedVersion, answers })
        }
        onReopen={(expectedVersion) => page.actions.reopenForm.mutate(expectedVersion)}
      />
      <SelectFormDialog
        isOpen={page.isFormSelectionOpen}
        onClose={() => page.setIsFormSelectionOpen(false)}
        onSelect={(form) => page.replaceForm(form.id)}
        contextType='formalization'
        initialLegalAreaId={formalization.legalAreaId ?? data.intake.legalAreaId}
        initialLegalTopicId={formalization.legalTopicId ?? data.intake.legalTopicId}
        initialSelectedFormId={formalization.contractFormId}
      />
      <FormalizationDocumentsSection
        page={page}
        formalizationId={formalizationId}
        isTerminal={isTerminal}
      />
      <FormalizationSendingConfiguration />
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
        <CloseWithoutContractAction data={data} page={page} />
        <div className='flex justify-end'>
          <Button
            variant='secondary'
            disabled
            aria-describedby='formalization-contract-confirmation-help'
          >
            Confirmar contratação
          </Button>
          <span id='formalization-contract-confirmation-help' className='sr-only'>
            A confirmação da contratação ficará disponível em uma etapa futura.
          </span>
        </div>
      </div>
    </main>
  )
}

type FormalizationPageController = ReturnType<typeof useFormalizationPage>

const FormalizationDocumentsSection = ({
  page,
  formalizationId,
  isTerminal,
}: {
  page: FormalizationPageController
  formalizationId: string
  isTerminal: boolean
}) => {
  const { navigateTo } = useNavigation()
  const [isSelectionOpen, setIsSelectionOpen] = useState(false)
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false)
  const production = page.documentProduction
  const selection = production.selectionQuery.data
  const items: readonly DocumentPackageItem[] = production.documents

  if (page.formalization?.contractFormState !== 'closed') return null

  const isReadOnly = isTerminal || production.isPackageConfirmed
  const actionError =
    production.documentsQuery.error ??
    production.selectionQuery.error ??
    production.generationMutation.error ??
    production.cancellationMutation.error ??
    production.selectionMutation.error ??
    production.confirmMutation.error

  async function handleConfirmRequest() {
    setIsConfirmationDialogOpen(true)
  }

  async function handleSaveSelection(documentSpecificationIds: readonly string[]) {
    try {
      await production.selectionMutation.mutateAsync(documentSpecificationIds)
      setIsSelectionOpen(false)
    } catch {
      // The mutation error is rendered in the package; keep the dialog open for retry.
    }
  }

  return (
    <>
      <DocumentPackage
        title='Documentos da formalização'
        description='Acompanhe a produção, a revisão e o histórico dos documentos vinculados.'
        summary={
          selection
            ? `${selection.selectedDocumentSpecificationIds.length} documentos selecionados`
            : `${items.length} documentos vinculados`
        }
        items={items}
        isLoading={
          production.documentsQuery.isLoading || production.selectionQuery.isLoading
        }
        isError={production.documentsQuery.isError || production.selectionQuery.isError}
        errorMessage={actionError?.message}
        isReadOnly={isReadOnly}
        isConfirmed={production.isPackageConfirmed}
        isConfirming={production.confirmMutation.isPending}
        isConfirmationEligible={production.isConfirmationEligible}
        onSelect={() => setIsSelectionOpen(true)}
        onConfirm={!production.isPackageConfirmed ? handleConfirmRequest : undefined}
        onRetry={() => production.documentsQuery.refetch()}
        onGenerateDocument={(documentId) =>
          production.handleGenerateDocument(documentId).catch(() => undefined)
        }
        onCancelDocumentGeneration={(documentId) =>
          production.cancellationMutation.mutateAsync(documentId).catch(() => undefined)
        }
        isCancellingDocument={production.isCancellingDocument}
        onRefreshDocument={() => production.documentsQuery.refetch()}
        renderAction={(action, item) => {
          const versionId = item.latestVersion?.id
          if (!versionId) return null
          const isReviewAction = action === 'review'
          return (
            <Button
              variant={isReviewAction ? 'default' : 'outline'}
              size='sm'
              className={
                isReviewAction
                  ? undefined
                  : 'rounded-full border-primary/40 px-3 text-primary hover:border-primary hover:bg-secondary hover:text-primary'
              }
              onClick={() =>
                void navigateTo('formalizationDocumentVersion', {
                  params: { formalizationId, documentVersionId: versionId },
                }).catch(() => undefined)
              }
            >
              {!isReviewAction && <Icon name='eye' className='size-3.5' />}
              {isReviewAction ? 'Revisar' : 'Visualizar'}
            </Button>
          )
        }}
      />
      <SelectFormalizationDocumentsDialog
        open={isSelectionOpen}
        options={selection?.options ?? []}
        selectedDocumentSpecificationIds={
          selection?.selectedDocumentSpecificationIds ?? []
        }
        isLoading={production.selectionQuery.isLoading}
        isSaving={production.selectionMutation.isPending}
        isReadOnly={isReadOnly}
        initialAreaId={
          page.query.data?.formalization.legalAreaId ??
          page.query.data?.intake.legalAreaId
        }
        initialTopicId={
          page.query.data?.formalization.legalTopicId ??
          page.query.data?.intake.legalTopicId
        }
        onOpenChange={setIsSelectionOpen}
        onSave={(ids) => void handleSaveSelection(ids)}
      />
      <DocumentPackageConfirmationDialog
        open={isConfirmationDialogOpen}
        isPending={production.confirmMutation.isPending}
        documentsCount={items.length}
        onOpenChange={setIsConfirmationDialogOpen}
        onConfirm={() => {
          const expectedVersion = page.formalization?.version
          if (expectedVersion !== undefined) {
            production.confirmMutation.mutate(expectedVersion)
          }
        }}
      />
    </>
  )
}

const CloseWithoutContractAction = ({
  data,
  page,
}: {
  data: NonNullable<FormalizationPageController['query']['data']>
  page: FormalizationPageController
}) => {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<IntakeClosureReason | ''>('')
  const [notes, setNotes] = useState('')
  const mutation = page.closeWithoutContract

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen && !mutation.isPending) {
      setReason('')
      setNotes('')
    }
  }

  return (
    <>
      <div className='flex justify-end'>
        <Button
          variant='ghost'
          className='text-muted-foreground'
          onClick={() => handleOpenChange(true)}
          disabled={data.formalization.status !== 'in_progress'}
        >
          Encerrar sem contratação
        </Button>
      </div>
      <CloseWithoutContractDialog
        open={open}
        isPending={mutation.isPending}
        reason={reason}
        notes={notes}
        error={mutation.error}
        onOpenChange={handleOpenChange}
        onReasonChange={setReason}
        onNotesChange={setNotes}
        onConfirm={(nextReason, nextNotes) =>
          mutation.mutate({ reason: nextReason, notes: nextNotes.trim() || undefined })
        }
      />
    </>
  )
}
