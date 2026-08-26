import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { DynamicForm } from '../../../shared/domain/entities'
import { fakeFormalization } from '../../domain/entities/fakers'
import type {
  FormalizationSourceReader,
  FormalizationsRepository,
} from '../../interfaces'
import { ReplaceFormalizationContractFormUseCase } from '../replace-formalization-contract-form-use-case'

describe('Replace Formalization Contract Form Use Case', () => {
  let repository: MockProxy<FormalizationsRepository>
  let sourceReader: MockProxy<FormalizationSourceReader>

  beforeEach(() => {
    repository = mock<FormalizationsRepository>()
    sourceReader = mock<FormalizationSourceReader>()
  })

  it('persists a new snapshot and clears answers while the form is open', async () => {
    const current = fakeFormalization({
      contractFormAnswers: [{ fieldId: 'old-field', value: 'old answer' }],
      contractFormRevision: 2,
    })
    const form = makeForm()
    const updated = fakeFormalization({
      ...current,
      contractFormId: form.id,
      contractFormAnswers: [],
      contractFormRevision: 0,
      version: current.version + 1,
    })
    repository.findById.mockResolvedValue(current)
    sourceReader.findContractForm.mockResolvedValue(form)
    repository.replace.mockResolvedValue(updated)

    await expect(
      new ReplaceFormalizationContractFormUseCase(repository, sourceReader).execute({
        formalizationId: current.id,
        actorId: current.assignedLawyerId,
        expectedVersion: current.version,
        dynamicFormId: form.id,
      }),
    ).resolves.toBe(updated)

    expect(repository.replace).toHaveBeenCalledWith({
      formalizationId: current.id,
      expectedVersion: current.version,
      changes: expect.objectContaining({
        contractFormId: form.id,
        contractFormAnswers: [],
        contractFormRevision: 0,
        contractFormState: 'open',
      }),
    })
  })

  it('rejects a form that is not available in the Intake context', async () => {
    const current = fakeFormalization()
    repository.findById.mockResolvedValue(current)
    sourceReader.findContractForm.mockResolvedValue(undefined)

    await expect(
      new ReplaceFormalizationContractFormUseCase(repository, sourceReader).execute({
        formalizationId: current.id,
        actorId: current.assignedLawyerId,
        expectedVersion: current.version,
        dynamicFormId: '00000000-0000-4000-8000-000000000999',
      }),
    ).rejects.toThrow('não está disponível')
    expect(repository.replace).not.toHaveBeenCalled()
  })
})

function makeForm(): DynamicForm {
  const now = new Date('2026-08-25T00:00:00.000Z')
  return {
    id: '00000000-0000-4000-8000-000000000821',
    name: 'Ficha provisória de contratação',
    status: 'available',
    contexts: [
      { type: 'formalization', data: { legalAreaId: 'area', legalTopicIds: ['topic'] } },
    ],
    fields: [
      {
        id: '00000000-0000-4000-8000-000000000822',
        key: 'party',
        label: 'Parte',
        type: 'short_text',
        position: 1,
        required: true,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}
