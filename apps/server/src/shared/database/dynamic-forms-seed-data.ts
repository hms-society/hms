import type { LegalArea, LegalTopic } from '@hms/core/legal-catalog/domain/entities'
import type { DynamicFormCreation, DynamicFormField } from '@hms/core/shared/domain'

type DynamicFormSeedDefinition = {
  readonly name: string
  readonly description: string
  readonly areaName: string
  readonly fields: readonly DynamicFormField[]
}

const dynamicFormSeedDefinitions: readonly DynamicFormSeedDefinition[] = [
  {
    name: 'Triagem Trabalhista',
    description:
      'Ficha inicial para organizar a relação de trabalho e a demanda apresentada.',
    areaName: 'Trabalhista',
    fields: [
      {
        id: 'employment-relationship',
        key: 'employment_relationship',
        label: 'Tipo de relação de trabalho',
        type: 'multiple_selection',
        position: 1,
        required: true,
        options: [
          { value: 'employment', label: 'Emprego', position: 1 },
          { value: 'service_provider', label: 'Prestação de serviços', position: 2 },
          { value: 'internship', label: 'Estágio', position: 3 },
        ],
      },
      {
        id: 'termination-reason',
        key: 'termination_reason',
        label: 'Motivo do encerramento ou conflito',
        type: 'long_text',
        position: 2,
        required: false,
        placeholder: 'Descreva o contexto principal da demanda',
      },
      {
        id: 'has-employment-record',
        key: 'has_employment_record',
        label: 'Possui registro formal da relação de trabalho?',
        type: 'boolean',
        position: 3,
        required: true,
      },
    ],
  },
  {
    name: 'Entrevista Trabalhista',
    description: 'Ficha para aprofundar o histórico contratual e as provas disponíveis.',
    areaName: 'Trabalhista',
    fields: [
      {
        id: 'employer-name',
        key: 'employer_name',
        label: 'Nome do empregador ou contratante',
        type: 'short_text',
        position: 1,
        required: true,
      },
      {
        id: 'employment-start-date',
        key: 'employment_start_date',
        label: 'Data de início da relação',
        type: 'date',
        position: 2,
        required: false,
      },
      {
        id: 'work-context',
        key: 'work_context',
        label: 'Descrição das atividades e condições de trabalho',
        type: 'long_text',
        position: 3,
        required: true,
      },
    ],
  },
  {
    name: 'Triagem Previdenciária',
    description:
      'Ficha inicial para identificar o benefício e o histórico previdenciário.',
    areaName: 'Previdenciário',
    fields: [
      {
        id: 'benefit-type',
        key: 'benefit_type',
        label: 'Tipo de benefício pretendido',
        type: 'multiple_selection',
        position: 1,
        required: true,
        options: [
          { value: 'retirement', label: 'Aposentadoria', position: 1 },
          { value: 'incapacity', label: 'Benefício por incapacidade', position: 2 },
          { value: 'review', label: 'Revisão de benefício', position: 3 },
        ],
      },
      {
        id: 'contribution-history',
        key: 'contribution_history',
        label: 'Resumo do histórico de contribuições',
        type: 'long_text',
        position: 2,
        required: false,
      },
      {
        id: 'has-previous-request',
        key: 'has_previous_request',
        label: 'Já houve pedido ou benefício anterior?',
        type: 'boolean',
        position: 3,
        required: true,
      },
    ],
  },
  {
    name: 'Entrevista Previdenciária',
    description:
      'Ficha para detalhar o histórico do segurado e a documentação disponível.',
    areaName: 'Previdenciário',
    fields: [
      {
        id: 'last-contribution-date',
        key: 'last_contribution_date',
        label: 'Data da última contribuição conhecida',
        type: 'date',
        position: 1,
        required: false,
      },
      {
        id: 'health-limitation',
        key: 'health_limitation',
        label: 'Limitação de saúde ou incapacidade relatada',
        type: 'long_text',
        position: 2,
        required: false,
      },
      {
        id: 'available-documents',
        key: 'available_documents',
        label: 'Documentos já disponíveis',
        type: 'multiple_selection',
        position: 3,
        required: false,
        options: [
          {
            value: 'work_records',
            label: 'Carteira ou registros de trabalho',
            position: 1,
          },
          {
            value: 'medical_reports',
            label: 'Laudos ou relatórios médicos',
            position: 2,
          },
          {
            value: 'contribution_records',
            label: 'Extrato de contribuições',
            position: 3,
          },
        ],
      },
    ],
  },
  {
    name: 'Triagem Cível',
    description: 'Ficha inicial para organizar o fato, a relação jurídica e a pretensão.',
    areaName: 'Cível',
    fields: [
      {
        id: 'civil-relationship',
        key: 'civil_relationship',
        label: 'Tipo de relação jurídica',
        type: 'multiple_selection',
        position: 1,
        required: true,
        options: [
          { value: 'contracts', label: 'Contratos', position: 1 },
          { value: 'civil-liability', label: 'Responsabilidade civil', position: 2 },
          { value: 'consumer', label: 'Relações de consumo', position: 3 },
        ],
      },
      {
        id: 'counterparty',
        key: 'counterparty',
        label: 'Parte contrária',
        type: 'short_text',
        position: 2,
        required: false,
      },
      {
        id: 'civil-facts',
        key: 'civil_facts',
        label: 'Descrição dos fatos',
        type: 'long_text',
        position: 3,
        required: true,
      },
    ],
  },
  {
    name: 'Entrevista Cível',
    description: 'Ficha para aprofundar datas, valores, provas e resultado pretendido.',
    areaName: 'Cível',
    fields: [
      {
        id: 'event-date',
        key: 'event_date',
        label: 'Data principal dos fatos',
        type: 'date',
        position: 1,
        required: false,
      },
      {
        id: 'claim-value',
        key: 'claim_value',
        label: 'Valor econômico aproximado',
        type: 'short_text',
        position: 2,
        required: false,
        placeholder: 'Ex.: R$ 10.000,00',
      },
      {
        id: 'desired-outcome',
        key: 'desired_outcome',
        label: 'Resultado pretendido pelo cliente',
        type: 'long_text',
        position: 3,
        required: true,
      },
    ],
  },
]

type LegalCatalogSeed = {
  readonly areas: readonly LegalArea[]
  readonly topics: readonly LegalTopic[]
}

export function createDynamicFormSeeds({
  areas,
  topics,
}: LegalCatalogSeed): DynamicFormCreation[] {
  return dynamicFormSeedDefinitions.map((definition) => {
    const area = areas.find(({ name }) => name === definition.areaName)

    if (!area) {
      throw new Error(`Área jurídica não encontrada para a ficha: ${definition.areaName}`)
    }

    const legalTopicIds = topics
      .filter((topic) => topic.legalAreaId === area.id)
      .map((topic) => topic.id)

    if (legalTopicIds.length === 0) {
      throw new Error(
        `Nenhum tema jurídico encontrado para a área: ${definition.areaName}`,
      )
    }

    return {
      name: definition.name,
      description: definition.description,
      status: 'available',
      contexts: [
        {
          type: 'legal',
          data: {
            legalAreaId: area.id,
            legalTopicIds,
          },
        },
      ],
      fields: definition.fields,
    }
  })
}
