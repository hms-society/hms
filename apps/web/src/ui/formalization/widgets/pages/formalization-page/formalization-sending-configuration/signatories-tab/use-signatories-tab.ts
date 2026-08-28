import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'
import type { CommunicationChannel } from '@hms/core/communication/domain/structures'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useFormalizationSignatureConfiguration } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

export type SignatoriesTabProps = {
  formalizationId: string
  expectedVersion: number
  configuration: FormalizationSignatureConfiguration
}

function haveDocumentAssignmentsChanged(
  previousSignatories: FormalizationSignatureConfiguration['signatories'],
  nextSignatories: FormalizationSignatureConfiguration['signatories'],
) {
  if (previousSignatories.length !== nextSignatories.length) return true

  const previousAssignments = new Map(
    previousSignatories.map((signatory) => [
      signatory.signatoryId,
      signatory.documentIds,
    ]),
  )

  return nextSignatories.some((signatory) => {
    const previousDocumentIds = previousAssignments.get(signatory.signatoryId)
    if (!previousDocumentIds) return true
    if (previousDocumentIds.length !== signatory.documentIds.length) return true

    return signatory.documentIds.some(
      (documentId) => !previousDocumentIds.includes(documentId),
    )
  })
}

function hasCompleteSignatoryConfiguration(
  signatories: FormalizationSignatureConfiguration['signatories'],
  selectedDocumentsBySignatory: Record<string, string[]>,
) {
  return signatories.every((signatory) => {
    const selectedDocuments =
      selectedDocumentsBySignatory[signatory.signatoryId] ?? signatory.documentIds
    return (
      selectedDocuments.length > 0 &&
      signatory.selectedChannels.length > 0 &&
      signatory.selectedChannels.every((channel) =>
        signatory.availableChannels.includes(channel),
      )
    )
  })
}

export function useSignatoriesTab({
  formalizationId,
  expectedVersion,
  configuration,
}: Pick<SignatoriesTabProps, 'formalizationId' | 'expectedVersion' | 'configuration'>) {
  const signatureConfiguration = useFormalizationSignatureConfiguration(formalizationId)
  const [isCandidateDialogOpen, setIsCandidateDialogOpen] = useState(false)
  const [selectedDocumentsBySignatory, setSelectedDocumentsBySignatory] = useState<
    Record<string, string[]>
  >(() =>
    Object.fromEntries(
      configuration.signatories.map((signatory) => [
        signatory.signatoryId,
        [...signatory.documentIds],
      ]),
    ),
  )
  const expectedVersionRef = useRef(Math.max(expectedVersion, configuration.version))
  const previousSignatoriesRef = useRef(configuration.signatories)

  useEffect(() => {
    expectedVersionRef.current = Math.max(
      expectedVersionRef.current,
      expectedVersion,
      configuration.version,
    )
  }, [configuration.version, expectedVersion])

  useEffect(() => {
    if (
      !haveDocumentAssignmentsChanged(
        previousSignatoriesRef.current,
        configuration.signatories,
      )
    ) {
      previousSignatoriesRef.current = configuration.signatories
      return
    }

    setSelectedDocumentsBySignatory(
      Object.fromEntries(
        configuration.signatories.map((signatory) => [
          signatory.signatoryId,
          [...signatory.documentIds],
        ]),
      ),
    )
    previousSignatoriesRef.current = configuration.signatories
  }, [configuration.signatories])

  const changedSignatories = useMemo(
    () =>
      configuration.signatories.filter((signatory) => {
        const selectedDocuments =
          selectedDocumentsBySignatory[signatory.signatoryId] ?? signatory.documentIds

        return (
          selectedDocuments.length !== signatory.documentIds.length ||
          selectedDocuments.some(
            (documentId) => !signatory.documentIds.includes(documentId),
          )
        )
      }),
    [configuration.signatories, selectedDocumentsBySignatory],
  )
  const canSaveAssignments =
    configuration.editable &&
    hasCompleteSignatoryConfiguration(
      configuration.signatories,
      selectedDocumentsBySignatory,
    )

  function handleSelectedDocumentsChange(
    signatoryId: string,
    documentIds: readonly string[],
  ) {
    setSelectedDocumentsBySignatory((current) => ({
      ...current,
      [signatoryId]: [...documentIds],
    }))
  }

  async function handleSaveAssignments() {
    if (
      !configuration.editable ||
      !canSaveAssignments ||
      signatureConfiguration.isReplacingSignatoryDocuments ||
      changedSignatories.length === 0
    ) {
      return
    }

    let currentExpectedVersion = expectedVersionRef.current
    for (const signatory of changedSignatories) {
      const savedConfiguration = await signatureConfiguration.replaceSignatoryDocuments({
        signatoryId: signatory.signatoryId,
        documentIds: selectedDocumentsBySignatory[signatory.signatoryId] ?? [],
        expectedVersion: currentExpectedVersion,
      })
      currentExpectedVersion = savedConfiguration.version
      expectedVersionRef.current = savedConfiguration.version
    }
  }

  async function handleSelectCandidate(personId: string) {
    const savedConfiguration = await signatureConfiguration.addSignatory({
      personId,
      expectedVersion: expectedVersionRef.current,
    })
    expectedVersionRef.current = savedConfiguration.version
    setIsCandidateDialogOpen(false)
  }

  async function handleSelectChannel(
    signatoryId: string,
    channel: CommunicationChannel,
    selected: boolean,
  ) {
    const savedConfiguration = await signatureConfiguration.selectSignatoryChannel({
      signatoryId,
      channel,
      selected,
      expectedVersion: expectedVersionRef.current,
    })
    expectedVersionRef.current = savedConfiguration.version
  }

  async function handleRemoveSignatory(signatoryId: string) {
    const savedConfiguration = await signatureConfiguration.removeSignatory({
      signatoryId,
      expectedVersion: expectedVersionRef.current,
    })
    expectedVersionRef.current = savedConfiguration.version
  }

  return {
    changedSignatories,
    canSaveAssignments,
    handleSaveAssignments,
    handleSelectedDocumentsChange,
    handleSelectCandidate,
    handleSelectChannel,
    handleRemoveSignatory,
    hasUnsavedAssignments: changedSignatories.length > 0,
    isAddingSignatory: signatureConfiguration.isAddingSignatory,
    isCandidateDialogOpen,
    isRemovingSignatory: signatureConfiguration.isRemovingSignatory,
    isReplacingSignatoryDocuments: signatureConfiguration.isReplacingSignatoryDocuments,
    isSelectingSignatoryChannel: signatureConfiguration.isSelectingSignatoryChannel,
    removeSignatoryError: signatureConfiguration.removeSignatoryError,
    selectedDocumentsBySignatory,
    setIsCandidateDialogOpen,
  }
}
