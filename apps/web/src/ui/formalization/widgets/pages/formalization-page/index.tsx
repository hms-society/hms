import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { SelectFormDialog } from '@/ui/shared/widgets/dynamic-form/select-form'

import { CommercialConditionsCard } from './commercial-conditions-card'
import { CloseWithoutContractAction } from './close-without-contract-action'
import { FormalizationDocumentsSection } from './formalization-documents-section'
import { FormalizationContextHeader } from './formalization-context-header'
import { FormalizationSendingConfigurationSummary } from './formalization-sending-configuration-summary'
import { ConfirmContractingAction } from './confirm-contracting-action'
import {
  FormalizationLoadingPanel,
  FormalizationStatePanel,
} from './formalization-state-panels'
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
        isReadOnly={isTerminal || page.isSignatureSendingLocked}
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
        formalizationId={formalizationId}
        formalization={formalization}
        intake={data.intake}
        isTerminal={isTerminal}
        isSignatureSendingLocked={page.isSignatureSendingLocked}
        production={page.documentProduction}
      />
      {page.documentProduction.isPackageConfirmed && (
        <FormalizationSendingConfigurationSummary
          formalizationId={formalizationId}
          isPackageConfirmed
          signatureStatus={page.signatureSending.status?.status}
          configuration={page.signatureConfiguration.configuration}
          controller={page.signatureConfiguration}
        />
      )}
      {page.documentProduction.isPackageConfirmed && (
        <ConfirmContractingAction
          intakeVersion={data.intake.version}
          status={page.signatureSending.status ?? null}
          isLoading={
            page.signatureSending.isLoadingReview || page.signatureSending.isLoadingStatus
          }
          isPending={page.signatureSending.isConfirmingContracting}
          error={page.signatureSending.confirmContractingError}
          onConfirm={page.signatureSending.confirmContracting}
        />
      )}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
        <CloseWithoutContractAction
          isEnabled={formalization.status === 'in_progress'}
          mutation={page.closeWithoutContract}
        />
      </div>
    </main>
  )
}
