import { Inject, Injectable } from '@nestjs/common'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type {
  DocumentTemplateContent,
  DocumentGenerationMoment,
  DocumentTemplateVariable,
} from '@hms/core/document-production/domain/structures'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'

export type DocumentProductionSeedReferences = {
  readonly legalAreas: readonly { id: string; name: string }[]
  readonly legalTopics: readonly { id: string; legalAreaId: string; name: string }[]
}

type DocumentTemplateSeed = {
  readonly name: string
  readonly description: string
  readonly paragraphs?: readonly string[]
  readonly content?: DocumentTemplateContent
  readonly variables: readonly DocumentTemplateVariable[]
  readonly moment?: DocumentGenerationMoment
  readonly legalAreaName?: string
  readonly legalTopicName?: string
}

const DOCUMENT_TEMPLATES: readonly DocumentTemplateSeed[] = [
  {
    name: 'Requerimento Administrativo de Aposentadoria',
    description:
      'Requerimento previdenciário para reconhecimento de tempo de contribuição e concessão de aposentadoria.',
    paragraphs: [
      'Ao Instituto Nacional do Seguro Social — INSS, {cliente_nome}, inscrito no CPF sob o nº {cliente_cpf}, requer a concessão do benefício previdenciário.',
      'O pedido inclui o reconhecimento do tempo de contribuição de {tempo_contribuicao} e a análise dos períodos não computados no CNIS.',
      'Instruem o requerimento os documentos de identificação, comprovante de residência, extrato do CNIS e comprovantes dos vínculos.',
    ],
    variables: [
      { label: 'Nome do cliente', technicalName: 'cliente_nome' },
      { label: 'CPF do cliente', technicalName: 'cliente_cpf' },
      { label: 'Tempo de contribuição', technicalName: 'tempo_contribuicao' },
    ],
  },
  {
    name: 'Manifestação sobre Tempo de Contribuição',
    description:
      'Manifestação previdenciária sobre divergências no tempo de contribuição reconhecido administrativamente.',
    paragraphs: [
      'AO INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS',
      'Processo/Caso nº: {numero_caso}',
      '{cliente_nome}, brasileiro(a), portador(a) do CPF nº {cliente_cpf}, por meio de seu procurador, apresenta a presente MANIFESTAÇÃO SOBRE TEMPO DE CONTRIBUIÇÃO, pelos fatos e fundamentos a seguir expostos.',
      '1. DA QUALIFICAÇÃO DAS PARTES',
      '{cliente_nome}, brasileiro(a), residente e domiciliado(a) no endereço informado no processo, por meio de seu procurador regularmente constituído, manifesta-se nos autos do processo/caso nº {numero_caso}, relativo ao benefício previdenciário em análise.',
      '2. DO OBJETO DA MANIFESTAÇÃO',
      'A presente manifestação tem por objeto o pronunciamento do requerente acerca do cômputo de tempo de contribuição apurado no âmbito do processo/caso, com vistas ao esclarecimento de divergências identificadas entre o tempo reconhecido administrativamente e aquele comprovado pela documentação constante dos autos, atualmente estimado em {tempo_contribuicao}.',
      '3. DO HISTÓRICO DO PROCESSAMENTO',
      'No curso da análise administrativa do benefício, foi apurado, com base nos registros do Cadastro Nacional de Informações Sociais (CNIS), tempo de contribuição divergente daquele apresentado pelo requerente.',
      'O requerente reuniu documentação complementar apta a esclarecer a divergência, notadamente registros funcionais, contratos de trabalho, recibos de pagamento e demais elementos de prova material, que corroboram a alegação do tempo de contribuição informado.',
      '4. DA ANÁLISE DO TEMPO DE CONTRIBUIÇÃO CONTROVERTIDO',
      'A divergência decorre, em grande medida, de falhas no repasse de informações por empregadores e tomadores de serviço, não podendo tal circunstância ser imputada ao segurado que efetivamente exerceu a atividade laboral e sofreu o desconto das contribuições previdenciárias.',
      'A responsabilidade pelo recolhimento das contribuições previdenciárias incidentes sobre a remuneração do empregado é do empregador, não podendo o segurado ser prejudicado por eventual inadimplemento ou omissão de terceiro na comunicação dos valores ao órgão previdenciário.',
      'Ainda que determinados períodos não constem integralmente no CNIS, tal circunstância não afasta o direito ao reconhecimento do tempo de contribuição, desde que devidamente comprovado por outros meios de prova idôneos.',
      '5. DO PEDIDO',
      'Diante do exposto, requer-se o recebimento e a juntada da presente manifestação aos autos; o reconhecimento do tempo de contribuição de {tempo_contribuicao}; a intimação do requerente acerca de eventual decisão; e, subsidiariamente, a apresentação de motivação específica quanto aos períodos não reconhecidos.',
      'Termos em que, pede deferimento.',
      'Comarca Fictícia, {data_documento}.',
      '{cliente_nome}\nRequerente',
    ],
    variables: [
      {
        label: 'Tempo de contribuição',
        technicalName: 'tempo_contribuicao',
      },
    ],
  },
  {
    name: 'Petição de Juntada de Documentos',
    description:
      'Petição para juntada de documentos complementares ao processo administrativo previdenciário.',
    paragraphs: [
      'O requerente {cliente_nome} requer a juntada de documentos complementares aos autos do processo/caso {numero_caso}.',
      'A documentação apresentada complementa a prova do tempo de contribuição e esclarece divergências identificadas na análise administrativa.',
      'São juntados documento de identificação, comprovante de residência, extrato do CNIS e documentos comprobatórios de vínculos empregatícios.',
    ],
    variables: [
      { label: 'Nome do cliente', technicalName: 'cliente_nome' },
      { label: 'CPF do cliente', technicalName: 'cliente_cpf' },
      { label: 'Número do caso', technicalName: 'numero_caso' },
    ],
  },
  {
    name: 'Requerimento Administrativo de Aposentadoria — Modelo Universal',
    description:
      'Modelo universal de requerimento administrativo previdenciário. Fatos, períodos contributivos e documentos devem ser preenchidos e conferidos para cada requerente antes da submissão.',
    moment: 'legal_production',
    legalAreaName: 'Previdenciário',
    legalTopicName: 'Aposentadoria',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, textAlign: 'center' },
          content: [
            {
              type: 'text',
              text: 'AO INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS',
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'center' },
          content: [
            {
              type: 'text',
              text: 'REQUERIMENTO ADMINISTRATIVO DE BENEFÍCIO PREVIDENCIÁRIO',
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [
            {
              type: 'text',
              text: 'Requerente: {{nome_requerente}} | CPF: {{cpf_requerente}} | NIT/PIS/PASEP: {{nit_requerente}}',
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [{ type: 'text', text: 'Endereço: {{endereco_requerente}}' }],
        },
        {
          type: 'heading',
          attrs: { level: 2, textAlign: 'left' },
          content: [{ type: 'text', text: 'I — DO OBJETO' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [
            {
              type: 'text',
              text: 'O(A) requerente acima identificado(a) solicita a análise de seu histórico previdenciário e a concessão do benefício {{beneficio_requerido}}, caso sejam preenchidos os requisitos legais aplicáveis. Requer, ainda, a análise do benefício mais vantajoso eventualmente cabível, conforme os elementos comprovados no processo administrativo.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2, textAlign: 'left' },
          content: [
            {
              type: 'text',
              text: 'II — DO HISTÓRICO CONTRIBUTIVO E DOS DOCUMENTOS',
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [
            {
              type: 'text',
              text: 'O histórico contributivo deverá ser conferido a partir do CNIS e dos documentos apresentados. Os períodos cuja análise é solicitada são: {{periodos_contributivos}}.',
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [
            {
              type: 'text',
              text: 'Documentos que instruem este requerimento: {{documentos_apresentados}}. A relação deve refletir exclusivamente os arquivos efetivamente juntados.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2, textAlign: 'left' },
          content: [{ type: 'text', text: 'III — DA ANÁLISE DO PEDIDO' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [
            {
              type: 'text',
              text: 'Requer-se a apuração dos requisitos previdenciários pertinentes, incluindo tempo de contribuição e carência quando aplicáveis, com consideração dos registros do CNIS e dos documentos apresentados. Eventuais divergências ou períodos não computados devem ser examinados individualmente, sem presumir como comprovado período que não esteja apoiado nos elementos dos autos.',
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [
            {
              type: 'text',
              text: 'Se os elementos indicarem mais de uma regra possível, requer-se a análise das hipóteses cabíveis na data relevante e a indicação fundamentada da opção mais vantajosa, acompanhada da memória de cálculo.',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2, textAlign: 'left' },
          content: [{ type: 'text', text: 'IV — DOS REQUERIMENTOS' }],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'o recebimento e o processamento do presente requerimento;',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'a análise do CNIS e dos documentos efetivamente apresentados, com exame dos períodos indicados;',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'a apuração dos requisitos e das regras previdenciárias aplicáveis, com memória de cálculo;',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'a concessão do benefício requerido, se comprovado o preenchimento dos requisitos;',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'caso sejam necessários elementos adicionais, a indicação objetiva das informações ou documentos pendentes;',
                    },
                  ],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'a emissão de decisão fundamentada, com identificação dos períodos considerados e não considerados.',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [{ type: 'text', text: 'Termos em que, pede deferimento.' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'left' },
          content: [{ type: 'text', text: '{{municipio}}, {{data_documento}}.' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'center' },
          content: [{ type: 'text', text: '__________________________________' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'center' },
          content: [{ type: 'text', text: '{{nome_requerente}} | Requerente' }],
        },
        {
          type: 'paragraph',
          attrs: { textAlign: 'center' },
          content: [
            {
              type: 'text',
              text: 'Representante, se houver: {{nome_representante}} | OAB/{{uf_oab}} {{numero_oab}}',
            },
          ],
        },
      ],
    } as unknown as DocumentTemplateContent,
    variables: [
      {
        label: 'Nome do requerente',
        technicalName: 'nome_requerente',
        description: 'Nome completo da pessoa requerente.',
      },
      {
        label: 'CPF do requerente',
        technicalName: 'cpf_requerente',
        description: 'CPF da pessoa requerente.',
      },
      {
        label: 'NIT/PIS/PASEP',
        technicalName: 'nit_requerente',
        description: 'Número previdenciário, se disponível.',
      },
      {
        label: 'Endereço do requerente',
        technicalName: 'endereco_requerente',
        description: 'Endereço atualizado da pessoa requerente.',
      },
      {
        label: 'Benefício requerido',
        technicalName: 'beneficio_requerido',
        description: 'Espécie ou denominação do benefício objeto do pedido.',
      },
      {
        label: 'Períodos contributivos',
        technicalName: 'periodos_contributivos',
        description:
          'Períodos cuja análise é requerida, conforme documentação conferida.',
      },
      {
        label: 'Documentos apresentados',
        technicalName: 'documentos_apresentados',
        description: 'Relação dos documentos efetivamente juntados.',
      },
      {
        label: 'Município',
        technicalName: 'municipio',
        description: 'Município indicado para fechamento do requerimento.',
      },
      {
        label: 'Data do documento',
        technicalName: 'data_documento',
        description: 'Data de elaboração do requerimento.',
      },
      {
        label: 'Nome do representante',
        technicalName: 'nome_representante',
        description: 'Nome do representante, quando houver.',
      },
      {
        label: 'UF da OAB',
        technicalName: 'uf_oab',
        description:
          'Unidade federativa de inscrição profissional, quando houver representante.',
      },
      {
        label: 'Número da OAB',
        technicalName: 'numero_oab',
        description: 'Número de inscrição profissional, quando houver representante.',
      },
    ],
  },
]

@Injectable()
export class DocumentProductionSeeder {
  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.generations)
    private readonly generationsRepository: DocumentGenerationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    private readonly specificationsRepository: DocumentSpecificationsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.versions)
    private readonly versionsRepository: DocumentVersionsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documents)
    private readonly documentsRepository: DocumentsRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.documentPackages)
    private readonly documentPackagesRepository: DocumentPackagesRepository,
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.packageDocuments)
    private readonly packageDocumentsRepository: PackageDocumentsRepository,
  ) {}

  async clear() {
    await this.packageDocumentsRepository.removeAll()
    await this.versionsRepository.removeAll()
    await this.generationsRepository.removeAll()
    await this.documentPackagesRepository.removeAll()
    await this.documentsRepository.removeAll()
    await this.specificationsRepository.removeAll()
  }

  async run(references: DocumentProductionSeedReferences) {
    const specificationCreations: DocumentSpecificationCreation[] =
      DOCUMENT_TEMPLATES.map((template) => {
        const legalAreaName = template.legalAreaName ?? 'Cível'
        const legalTopicName = template.legalTopicName ?? 'Contratos'
        const area = references.legalAreas.find(({ name }) => name === legalAreaName)
        const topic = references.legalTopics.find(
          ({ legalAreaId, name }) => legalAreaId === area?.id && name === legalTopicName,
        )

        if (!area || !topic) {
          throw new AppError(
            `Document Production seed references for ${legalAreaName} / ${legalTopicName} are required.`,
            'Seed Error',
          )
        }

        return {
          name: template.name,
          description: template.description,
          content:
            template.content ??
            this.createTemplateContent(template.name, template.paragraphs ?? []),
          variables: [...template.variables],
          application: {
            scope: 'legal_context',
            moment: template.moment ?? 'consultation',
            legalAreaIds: [area.id],
            legalTopicIdsByArea: { [area.id]: [topic.id] },
          },
          status: 'available',
        }
      })
    return {
      specifications: await this.specificationsRepository.addMany(specificationCreations),
    }
  }

  private createTemplateContent(
    title: string,
    paragraphs: readonly string[],
  ): DocumentTemplateContent {
    return {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, textAlign: 'center' },
          content: [{ type: 'text', text: title }],
        },
        ...paragraphs.map((paragraph) => ({
          type: 'paragraph' as const,
          attrs: { textAlign: 'left' as const },
          content: [{ type: 'text' as const, text: paragraph }],
        })),
      ],
    } as unknown as DocumentTemplateContent
  }
}
