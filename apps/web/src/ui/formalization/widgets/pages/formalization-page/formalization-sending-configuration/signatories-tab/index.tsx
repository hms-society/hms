import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { CandidateDialog } from './candidate-dialog'
import { SignatoryCard } from './signatory-card'
import { useSignatoriesTab } from './use-signatories-tab'
import type { SignatoriesTabProps } from './use-signatories-tab'

export type { SignatoriesTabProps } from './use-signatories-tab'

export const SignatoriesTab = ({
  formalizationId,
  expectedVersion,
  configuration,
}: SignatoriesTabProps) => {
  const {
    handleSaveAssignments,
    handleSelectedDocumentsChange,
    handleSelectCandidate,
    handleRemoveSignatory,
    handleSelectChannel,
    canSaveAssignments,
    isAddingSignatory,
    isCandidateDialogOpen,
    isRemovingSignatory,
    isReplacingSignatoryDocuments,
    isSelectingSignatoryChannel,
    removeSignatoryError,
    selectedDocumentsBySignatory,
    setIsCandidateDialogOpen,
  } = useSignatoriesTab({ formalizationId, expectedVersion, configuration })

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-start gap-3'>
          <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <Icon name='users' className='size-5' />
          </span>
          <div>
            <h3 className='font-serif text-lg font-semibold'>Signatários</h3>
            <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
              Defina quem assina cada documento e o canal disponível para contato.
            </p>
          </div>
        </div>
        <Button
          type='button'
          variant='outline'
          className='shrink-0'
          onClick={() => setIsCandidateDialogOpen(true)}
        >
          <Icon name='user' className='size-4' /> Adicionar signatário
        </Button>
      </div>

      <div className='grid gap-4'>
        {configuration.signatories.map((signatory) => (
          <SignatoryCard
            key={signatory.signatoryId}
            signatory={signatory}
            documents={configuration.documents}
            selectedDocuments={
              selectedDocumentsBySignatory[signatory.signatoryId] ?? signatory.documentIds
            }
            onSelectedDocumentsChange={(documentIds) =>
              handleSelectedDocumentsChange(signatory.signatoryId, documentIds)
            }
            isRemovingSignatory={isRemovingSignatory}
            isReplacingSignatoryDocuments={isReplacingSignatoryDocuments}
            isSelectingSignatoryChannel={isSelectingSignatoryChannel}
            removeSignatoryError={removeSignatoryError}
            onRemoveSignatory={() => handleRemoveSignatory(signatory.signatoryId)}
            onSelectChannel={(channel, selected) =>
              handleSelectChannel(signatory.signatoryId, channel, selected)
            }
          />
        ))}
      </div>

      {configuration.signatories.length > 0 && (
        <div className='flex justify-end'>
          <Button
            type='button'
            size='sm'
            variant='secondary'
            disabled={!canSaveAssignments || isReplacingSignatoryDocuments}
            onClick={() => void handleSaveAssignments()}
          >
            {isReplacingSignatoryDocuments
              ? 'Salvando atribuições...'
              : 'Salvar atribuições'}
          </Button>
        </div>
      )}

      <CandidateDialog
        formalizationId={formalizationId}
        open={isCandidateDialogOpen}
        isPending={isAddingSignatory}
        onOpenChange={setIsCandidateDialogOpen}
        onSelect={handleSelectCandidate}
      />
    </div>
  )
}
