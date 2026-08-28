import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'
import type {
  FormalizationSignatureConfigurationRepository,
  FormalizationSignatureSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { ListFormalizationSignatureCandidatesUseCase } from '../list-formalization-signature-candidates-use-case'
import {
  makeConfiguration,
  makeFormalization,
} from './signature-configuration-test-helpers'

describe('List Formalization Signature Candidates Use Case', () => {
  it('passes authoritative exclusions and pagination to the source reader', async () => {
    const formalization = makeFormalization()
    const configuration = makeConfiguration({ formalizationId: formalization.id })
    const formalizationsRepository = mock<FormalizationsRepository>()
    const configurationRepository = mock<FormalizationSignatureConfigurationRepository>()
    const sourceReader = mock<FormalizationSignatureSourceReader>()
    const page = { items: [], page: 2, limit: 10, total: 0 }
    formalizationsRepository.findById.mockResolvedValue(formalization)
    configurationRepository.findByFormalizationId.mockResolvedValue(configuration)
    sourceReader.listEligibleCandidates.mockResolvedValue(page)

    await expect(
      new ListFormalizationSignatureCandidatesUseCase(
        formalizationsRepository,
        configurationRepository,
        sourceReader,
      ).execute({
        formalizationId: formalization.id,
        actorId: formalization.assignedLawyerId,
        page: 2,
        limit: 10,
        search: 'Ana',
      }),
    ).resolves.toBe(page)
    expect(sourceReader.listEligibleCandidates).toHaveBeenCalledWith({
      formalizationId: formalization.id,
      page: 2,
      limit: 10,
      search: 'Ana',
      excludedPersonIds: ['person-id'],
    })
  })
})
