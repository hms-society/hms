import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { IdProvider } from '#shared/interfaces/id-provider'

import type { DynamicForm } from '../../domain/entities/dynamic-form'
import { DynamicFormDefinitionValidationError } from '../../domain/errors'
import type { DynamicFormDefinitionDraft } from '../../domain/structures/dynamic-form-definition-draft'
import { ValidateDynamicFormDefinitionUseCase } from '../validate-dynamic-form-definition-use-case'

describe('Validate Dynamic Form Definition Use Case', () => {
  let idProvider: MockProxy<IdProvider>
  let useCase: ValidateDynamicFormDefinitionUseCase

  beforeEach(() => {
    idProvider = mock<IdProvider>()
    let generatedId = 0
    idProvider.generate.mockImplementation(() => `generated-${++generatedId}`)
    useCase = new ValidateDynamicFormDefinitionUseCase(idProvider)
  })

  it('normalizes labels, generates stable technical identities and converts selection defaults', async () => {
    const draft: DynamicFormDefinitionDraft = {
      name: '  Ficha de Contratação  ',
      description: '  Descrição da ficha  ',
      stage: 'formalization',
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields: [
        {
          label: '  Nome do cliente  ',
          type: 'short_text',
          required: true,
          placeholder: '  Informe o nome  ',
          defaultValue: '  Cliente  ',
        },
        {
          label: 'Nome do cliente',
          type: 'single_selection',
          required: false,
          options: [{ label: 'Pessoa física' }, { label: 'Pessoa jurídica' }],
          defaultOptionIndex: 1,
        },
        {
          label: 'Percentual de êxito',
          type: 'percentage',
          required: false,
          validation: { scale: 2 },
          defaultValue: 12.5,
        },
      ],
    }

    const fields = await useCase.execute({ draft })

    expect(fields).toMatchObject([
      {
        id: 'generated-1',
        key: 'nome_do_cliente',
        label: 'Nome do cliente',
        position: 0,
        placeholder: 'Informe o nome',
        defaultValue: 'Cliente',
      },
      {
        id: 'generated-2',
        key: 'nome_do_cliente_2',
        options: [
          {
            id: 'generated-3',
            value: 'pessoa_fisica',
            label: 'Pessoa física',
            position: 0,
          },
          {
            id: 'generated-4',
            value: 'pessoa_juridica',
            label: 'Pessoa jurídica',
            position: 1,
          },
        ],
        defaultValue: 'pessoa_juridica',
      },
      {
        id: 'generated-5',
        key: 'percentual_de_exito',
        validation: { scale: 2 },
        defaultValue: 12.5,
      },
    ])
  })

  it('accepts every field type for Consultation', async () => {
    const draft: DynamicFormDefinitionDraft = {
      name: 'Ficha de Consulta',
      stage: 'consultation',
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields: [
        { label: 'Texto curto', type: 'short_text', required: false },
        { label: 'Texto longo', type: 'long_text', required: false },
        { label: 'Data', type: 'date', required: false },
        { label: 'Sim ou não', type: 'boolean', required: false },
        {
          label: 'Múltipla escolha',
          type: 'multiple_selection',
          required: false,
          options: [{ label: 'Uma opção' }],
        },
        {
          label: 'Seleção única',
          type: 'single_selection',
          required: false,
          options: [{ label: 'Uma opção' }],
        },
        { label: 'Número inteiro', type: 'integer', required: false },
        { label: 'Moeda', type: 'currency', required: false, currency: 'BRL' },
        {
          label: 'Percentual',
          type: 'percentage',
          required: false,
          validation: { scale: 2 },
        },
      ],
    }

    await expect(useCase.execute({ draft })).resolves.toHaveLength(9)
  })

  it('accepts every field type for Formalization', async () => {
    const draft: DynamicFormDefinitionDraft = {
      name: 'Ficha de Formalização',
      stage: 'formalization',
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields: [
        { label: 'Texto curto', type: 'short_text', required: false },
        { label: 'Texto longo', type: 'long_text', required: false },
        { label: 'Data', type: 'date', required: false },
        { label: 'Sim ou não', type: 'boolean', required: false },
        {
          label: 'Múltipla escolha',
          type: 'multiple_selection',
          required: false,
          options: [{ label: 'Uma opção' }],
        },
        {
          label: 'Seleção única',
          type: 'single_selection',
          required: false,
          options: [{ label: 'Uma opção' }],
        },
        { label: 'Número inteiro', type: 'integer', required: false },
        { label: 'Moeda', type: 'currency', required: false, currency: 'BRL' },
        {
          label: 'Percentual',
          type: 'percentage',
          required: false,
          validation: { scale: 2 },
        },
      ],
    }

    await expect(useCase.execute({ draft })).resolves.toHaveLength(9)
  })

  it('validates stage, defaults, numeric rules, option indexes and property compatibility in order', async () => {
    const draft = {
      name: 'Ficha',
      stage: 'consultation',
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields: [
        {
          label: 'Seleção',
          type: 'single_selection' as const,
          required: false,
          options: [{ label: 'Uma opção' }],
          defaultOptionIndex: 2,
        },
        {
          label: 'Percentual',
          type: 'percentage' as const,
          required: false,
          validation: { scale: 5 },
          defaultValue: 101,
        },
        {
          label: 'Texto',
          type: 'short_text' as const,
          required: false,
          validation: { min: 2 },
        },
      ],
    } satisfies DynamicFormDefinitionDraft

    await expect(useCase.execute({ draft })).rejects.toMatchObject({
      issues: expect.arrayContaining([
        expect.objectContaining({ path: 'fields.0.defaultOptionIndex' }),
        expect.objectContaining({ path: 'fields.1.validation.scale' }),
        expect.objectContaining({ path: 'fields.1.defaultValue' }),
        expect.objectContaining({ path: 'fields.2.validation' }),
      ]),
    })
    await expect(useCase.execute({ draft })).rejects.toBeInstanceOf(
      DynamicFormDefinitionValidationError,
    )
  })

  it('keeps persisted field and option identities and retained conditional rules', async () => {
    const existingForm: DynamicForm = {
      id: 'form-id',
      name: 'Ficha',
      normalizedName: 'ficha',
      description: null,
      status: 'available',
      stage: 'formalization',
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields: [
        {
          id: 'field-id',
          key: 'client_name',
          label: 'Nome',
          type: 'short_text',
          position: 0,
          required: true,
          validation: { requiredWhen: { fieldKey: 'kind', equals: 'company' } },
        },
        {
          id: 'kind-id',
          key: 'kind',
          label: 'Tipo',
          type: 'single_selection',
          position: 1,
          required: true,
          options: [{ id: 'option-id', value: 'company', label: 'Empresa', position: 0 }],
        },
      ],
      version: 4,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    }
    const draft: DynamicFormDefinitionDraft = {
      name: 'Ficha',
      stage: 'formalization',
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields: [
        {
          fieldId: 'field-id',
          label: 'Nome atualizado',
          type: 'short_text',
          required: true,
        },
        {
          fieldId: 'kind-id',
          label: 'Tipo atualizado',
          type: 'single_selection',
          required: true,
          options: [{ optionId: 'option-id', label: 'Empresa atualizada' }],
        },
      ],
    }

    const fields = await useCase.execute({ draft, existingForm })

    expect(fields[0]).toMatchObject({
      id: 'field-id',
      key: 'client_name',
      validation: { requiredWhen: { fieldKey: 'kind', equals: 'company' } },
    })
    expect(fields[1]).toMatchObject({
      id: 'kind-id',
      key: 'kind',
      options: [{ id: 'option-id', value: 'company', label: 'Empresa atualizada' }],
    })
    expect(idProvider.generate).not.toHaveBeenCalled()
  })

  it('clears incompatible inherited validation during destructive type changes', async () => {
    const existingForm: DynamicForm = {
      id: 'form-id',
      name: 'Ficha',
      normalizedName: 'ficha',
      description: null,
      status: 'available',
      stage: 'formalization',
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields: [
        {
          id: 'text-id',
          key: 'texto',
          label: 'Texto',
          type: 'short_text',
          position: 0,
          required: false,
          validation: { min: 2, max: 80, scale: 2 },
        },
        {
          id: 'date-id',
          key: 'data',
          label: 'Data',
          type: 'date',
          position: 1,
          required: false,
          validation: { min: 2, max: 80, scale: 2 },
        },
        {
          id: 'integer-id',
          key: 'inteiro',
          label: 'Inteiro',
          type: 'integer',
          position: 2,
          required: false,
          validation: { min: 2, max: 80, scale: 2 },
        },
        {
          id: 'percentage-id',
          key: 'percentual',
          label: 'Percentual',
          type: 'percentage',
          position: 3,
          required: false,
          validation: { min: 0, max: 100, scale: 3 },
        },
        {
          id: 'currency-id',
          key: 'moeda',
          label: 'Moeda',
          type: 'currency',
          position: 4,
          required: false,
          currency: 'BRL',
          validation: { min: 1, max: 10, scale: 2 },
        },
      ],
      version: 4,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
      updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    }

    const fields = await useCase.execute({
      existingForm,
      draft: {
        name: 'Ficha',
        stage: 'formalization',
        legalAreaId: 'area-id',
        legalTopicIds: ['topic-id'],
        fields: [
          {
            fieldId: 'text-id',
            label: 'Texto',
            type: 'date',
            required: false,
          },
          {
            fieldId: 'date-id',
            label: 'Data',
            type: 'boolean',
            required: false,
          },
          {
            fieldId: 'integer-id',
            label: 'Inteiro',
            type: 'percentage',
            required: false,
          },
          {
            fieldId: 'percentage-id',
            label: 'Percentual',
            type: 'integer',
            required: false,
          },
          {
            fieldId: 'currency-id',
            label: 'Moeda',
            type: 'short_text',
            required: false,
          },
        ],
      },
    })

    expect(fields.map(({ id, validation }) => ({ id, validation }))).toEqual([
      { id: 'text-id', validation: undefined },
      { id: 'date-id', validation: undefined },
      { id: 'integer-id', validation: { scale: 2 } },
      { id: 'percentage-id', validation: undefined },
      { id: 'currency-id', validation: undefined },
    ])
  })

  it('rejects removal of a conditional-rule dependency instead of erasing the rule', async () => {
    const existingForm = {
      id: 'form-id',
      name: 'Ficha',
      normalizedName: 'ficha',
      description: null,
      status: 'available' as const,
      stage: 'formalization' as const,
      legalAreaId: 'area-id',
      legalTopicIds: ['topic-id'],
      fields: [
        {
          id: 'field-id',
          key: 'dependent',
          label: 'Dependente',
          type: 'short_text' as const,
          position: 0,
          required: true,
          validation: { requiredWhen: { fieldKey: 'removed', equals: true } },
        },
      ],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies DynamicForm

    await expect(
      useCase.execute({
        existingForm,
        draft: {
          name: 'Ficha',
          stage: 'formalization',
          legalAreaId: 'area-id',
          legalTopicIds: ['topic-id'],
          fields: [
            {
              fieldId: 'field-id',
              label: 'Dependente',
              type: 'short_text',
              required: true,
            },
          ],
        },
      }),
    ).rejects.toMatchObject({
      issues: [
        expect.objectContaining({ path: expect.stringContaining('requiredWhen') }),
      ],
    })
  })
})
