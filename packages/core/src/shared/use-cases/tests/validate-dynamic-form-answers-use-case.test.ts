import { describe, expect, it } from 'vitest'
import type { DynamicFormAnswer } from '../../domain'
import { DynamicFormAnswerValidationMode } from '../../domain/structures'
import { InvalidDynamicFormDefinitionError } from '../../domain/errors'
import { fakeDynamicFormSnapshot } from '../../domain/structures/fakers'
import { ValidateDynamicFormAnswersUseCase } from '../validate-dynamic-form-answers-use-case'

describe('Validate Dynamic Form Answers Use Case', () => {
  it('normalizes and validates every supported field type in draft mode', async () => {
    const snapshot = fakeDynamicFormSnapshot({
      fields: [
        {
          id: 'text',
          key: 'text',
          label: 'Texto',
          type: 'short_text',
          position: 0,
          required: true,
        },
        {
          id: 'choice',
          key: 'choice',
          label: 'Escolha',
          type: 'single_selection',
          position: 1,
          required: false,
          options: [
            { value: 'yes', label: 'Sim', position: 0 },
            { value: 'no', label: 'Não', position: 1 },
          ],
        },
        {
          id: 'integer',
          key: 'integer',
          label: 'Inteiro',
          type: 'integer',
          position: 2,
          required: false,
          validation: { min: 1, max: 5 },
        },
        {
          id: 'currency',
          key: 'currency',
          label: 'Valor',
          type: 'currency',
          position: 3,
          required: false,
          validation: { scale: 2 },
        },
        {
          id: 'percentage',
          key: 'percentage',
          label: 'Percentual',
          type: 'percentage',
          position: 4,
          required: false,
        },
        {
          id: 'multi',
          key: 'multi',
          label: 'Múltipla',
          type: 'multiple_selection',
          position: 5,
          required: false,
          options: [{ value: 'a', label: 'A', position: 0 }],
        },
        {
          id: 'conditional',
          key: 'conditional',
          label: 'Condicional',
          type: 'boolean',
          position: 6,
          required: false,
          validation: { requiredWhen: { fieldKey: 'choice', equals: 'yes' } },
        },
      ],
    })

    await expect(
      new ValidateDynamicFormAnswersUseCase().execute({
        snapshot,
        mode: DynamicFormAnswerValidationMode.Draft,
        answers: [
          { fieldId: 'text', value: '  texto  ' },
          { fieldId: 'choice', value: 'yes' },
          { fieldId: 'integer', value: 3 },
          { fieldId: 'currency', value: 12.5 },
          { fieldId: 'percentage', value: 100 },
          { fieldId: 'multi', value: ['a', 'a'] },
          { fieldId: 'conditional', value: true },
        ],
      }),
    ).resolves.toEqual({
      answers: [
        { fieldId: 'text', value: 'texto' },
        { fieldId: 'choice', value: 'yes' },
        { fieldId: 'integer', value: 3 },
        { fieldId: 'currency', value: 12.5 },
        { fieldId: 'percentage', value: 100 },
        { fieldId: 'multi', value: ['a'] },
        { fieldId: 'conditional', value: true },
      ],
      issues: [],
    })
  })

  it('returns field-addressable issues for complete required and invalid answers', async () => {
    const snapshot = fakeDynamicFormSnapshot({
      fields: [
        {
          id: 'required',
          key: 'required',
          label: 'Obrigatório',
          type: 'short_text',
          position: 0,
          required: true,
        },
        {
          id: 'number',
          key: 'number',
          label: 'Número',
          type: 'integer',
          position: 1,
          required: false,
          validation: { min: 1, max: 4 },
        },
      ],
    })

    const result = await new ValidateDynamicFormAnswersUseCase().execute({
      snapshot,
      mode: DynamicFormAnswerValidationMode.Complete,
      answers: [
        { fieldId: 'number', value: 9 },
        { fieldId: 'unknown', value: 'value' },
      ],
    })

    expect(result.issues).toEqual(
      expect.arrayContaining([
        { path: 'field:number', message: 'Informe um valor menor ou igual a 4.' },
        { path: 'field:unknown', message: 'O campo informado não pertence à definição do formulário.' },
        { path: 'field:required', message: 'Este campo é obrigatório.' },
      ]),
    )
  })

  it.each([
    ['mixed', ['a', 42]],
    ['only invalid', [42, false]],
  ])('preserves %s multiple-selection items for validation', async (_caseName, value) => {
    const snapshot = fakeDynamicFormSnapshot({
      fields: [
        {
          id: 'multi',
          key: 'multi',
          label: 'Múltipla',
          type: 'multiple_selection',
          position: 0,
          required: false,
          options: [{ value: 'a', label: 'A', position: 0 }],
        },
      ],
    })
    const invalidValue = value as unknown as DynamicFormAnswer['value']

    const result = await new ValidateDynamicFormAnswersUseCase().execute({
      snapshot,
      mode: DynamicFormAnswerValidationMode.Draft,
      answers: [{ fieldId: 'multi', value: invalidValue }],
    })

    expect(result).toEqual({
      answers: [{ fieldId: 'multi', value }],
      issues: [{ path: 'field:multi', message: 'Informe uma lista de opções válida.' }],
    })
  })

  it('rejects malformed definitions before inspecting answers', async () => {
    const snapshot = fakeDynamicFormSnapshot({
      fields: [
        {
          id: 'invalid',
          key: 'invalid',
          label: 'Inválido',
          type: 'single_selection',
          position: 0,
          required: false,
        },
      ],
    })

    await expect(
      new ValidateDynamicFormAnswersUseCase().execute({
        snapshot,
        mode: DynamicFormAnswerValidationMode.Draft,
        answers: [],
      }),
    ).rejects.toBeInstanceOf(InvalidDynamicFormDefinitionError)
  })
})
