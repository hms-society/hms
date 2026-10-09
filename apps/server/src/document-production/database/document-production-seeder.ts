import { Inject, Injectable } from '@nestjs/common'
import type {
  DocumentGenerationCreation,
  DocumentGeneration,
  DocumentCreation,
  DocumentPackageCreation,
  DocumentSpecificationCreation,
  DocumentVersion,
  DocumentVersionCreation,
  PackageDocumentCreation,
} from '@hms/core/document-production/domain/entities'
import {
  DocumentGenerationFaker,
  DocumentFaker,
  DocumentPackageFaker,
  PackageDocumentFaker,
  DocumentVersionFaker,
} from '@hms/core/document-production/domain/entities/fakers'
import type {
  DocumentTemplateContent,
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
import { FindDocumentPendingMarkersUseCase } from '@hms/core/document-production/use-cases'
import { AppError } from '@hms/core/shared/domain/errors'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'

export type DocumentProductionSeedReferences = {
  readonly legalAreas: readonly { id: string; name: string }[]
  readonly legalTopics: readonly { id: string; legalAreaId: string; name: string }[]
  readonly hasPendingDocumentData?: boolean
  readonly consultationId: string
  readonly requestedByCollaboratorId?: string
}

type DocumentTemplateSeed = {
  readonly documentId: string
  readonly name: string
  readonly description: string
  readonly paragraphs: readonly string[]
  readonly variables: readonly DocumentTemplateVariable[]
}

const DOCUMENT_TEMPLATES = [
  {
    documentId: '00000000-0000-4000-8000-000000000201',
    name: 'Procuração',
    description: 'Procuração para representação em negociação contratual.',
    paragraphs: [
      '{cliente_nome}, inscrito no CPF sob o nº {cliente_cpf}, nomeia seu procurador para representá-lo.',
      'Os poderes ficam limitados à análise e à negociação do contrato relacionado ao atendimento descrito na consulta.',
      'Área jurídica: {area_juridica}. Tema jurídico: {tema_juridico}.',
    ],
    variables: [
      { label: 'Nome do cliente', technicalName: 'cliente_nome' },
      { label: 'CPF do cliente', technicalName: 'cliente_cpf' },
      { label: 'Área jurídica', technicalName: 'area_juridica' },
      { label: 'Tema jurídico', technicalName: 'tema_juridico' },
    ],
  },
  {
    documentId: '00000000-0000-4000-8000-000000000202',
    name: 'Declaração de informações da consulta',
    description: 'Síntese declaratória dos dados apresentados durante a consulta.',
    paragraphs: [
      'Declaro que as informações usadas neste documento correspondem aos dados apresentados na consulta.',
      'Questão principal: {questao_juridica_principal}.',
      'Orientação registrada: {orientacao_fornecida}.',
    ],
    variables: [
      {
        label: 'Questão jurídica principal',
        technicalName: 'questao_juridica_principal',
      },
      { label: 'Orientação fornecida', technicalName: 'orientacao_fornecida' },
    ],
  },
  {
    documentId: '00000000-0000-4000-8000-000000000203',
    name: 'Teste de revisão — Procuração inconsistente',
    description:
      'Cenário intencionalmente inconsistente para exercitar a revisão automática.',
    paragraphs: [
      '{cliente_nome}, inscrito no CPF sob o nº {cliente_cpf}, nomeia seu procurador para representá-lo.',
      'O mandato é exclusivamente limitado à análise e à negociação do contrato de locação residencial descrito na consulta.',
      'Sem prejuízo da limitação anterior, o procurador recebe poderes gerais, irrestritos e irrevogáveis para alienar, adquirir e onerar quaisquer bens do outorgante.',
      'O objeto da representação é a compra e venda de imóvel comercial situado em {endereco_imovel_comercial}.',
      'Fica expressamente declarado que a consulta não estabeleceu qualquer limitação aos poderes concedidos.',
    ],
    variables: [
      { label: 'Nome do cliente', technicalName: 'cliente_nome' },
      { label: 'CPF do cliente', technicalName: 'cliente_cpf' },
      {
        label: 'Endereço do imóvel comercial',
        technicalName: 'endereco_imovel_comercial',
      },
    ],
  },
] as const satisfies readonly DocumentTemplateSeed[]

const PENDING_MARKERS_TEMPLATE = {
  documentId: '00000000-0000-4000-8000-000000000204',
  name: 'Teste de pendências — Procuração para locação',
  description:
    'Modelo para testar dados ausentes, o registro de pendências e o bloqueio da aprovação.',
  paragraphs: [
    'O cliente nomeia {procurador_nome}, inscrito na OAB sob o nº {procurador_oab}, para representá-lo na negociação da locação residencial.',
    'O imóvel objeto da negociação está situado em {endereco_imovel}.',
    'Os poderes ficam limitados à análise e à negociação do contrato de locação residencial.',
  ],
  variables: [
    { label: 'Nome do procurador', technicalName: 'procurador_nome' },
    { label: 'Inscrição do procurador na OAB', technicalName: 'procurador_oab' },
    { label: 'Endereço do imóvel', technicalName: 'endereco_imovel' },
  ],
} as const satisfies DocumentTemplateSeed

export const UNIVERSAL_RETIREMENT_TEMPLATE = {
  name: 'Requerimento Administrativo de Aposentadoria — Modelo Universal',
  description:
    'Modelo universal de requerimento administrativo previdenciário. Fatos, períodos contributivos e documentos devem ser preenchidos e conferidos para cada requerente antes da submissão.',
  moment: 'legal_production' as const,
  legalAreaName: 'Previdenciário',
  legalTopicName: 'Aposentadoria',
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1, textAlign: 'center' },
        content: [
          { type: 'text', text: 'AO INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS' },
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
          { type: 'text', text: 'II — DO HISTÓRICO CONTRIBUTIVO E DOS DOCUMENTOS' },
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
          'o recebimento e o processamento do presente requerimento;',
          'a análise do CNIS e dos documentos efetivamente apresentados, com exame dos períodos indicados;',
          'a apuração dos requisitos e das regras previdenciárias aplicáveis, com memória de cálculo;',
          'a concessão do benefício requerido, se comprovado o preenchimento dos requisitos;',
          'caso sejam necessários elementos adicionais, a indicação objetiva das informações ou documentos pendentes;',
          'a emissão de decisão fundamentada, com identificação dos períodos considerados e não considerados.',
        ].map((text) => ({
          type: 'listItem' as const,
          content: [
            { type: 'paragraph' as const, content: [{ type: 'text' as const, text }] },
          ],
        })),
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
    { label: 'Nome do requerente', technicalName: 'nome_requerente' },
    { label: 'CPF do requerente', technicalName: 'cpf_requerente' },
    { label: 'NIT/PIS/PASEP', technicalName: 'nit_requerente' },
    { label: 'Endereço do requerente', technicalName: 'endereco_requerente' },
    { label: 'Benefício requerido', technicalName: 'beneficio_requerido' },
    { label: 'Períodos contributivos', technicalName: 'periodos_contributivos' },
    { label: 'Documentos apresentados', technicalName: 'documentos_apresentados' },
    { label: 'Município', technicalName: 'municipio' },
    { label: 'Data do documento', technicalName: 'data_documento' },
    { label: 'Nome do representante', technicalName: 'nome_representante' },
    { label: 'UF da OAB', technicalName: 'uf_oab' },
    { label: 'Número da OAB', technicalName: 'numero_oab' },
  ],
} as const

const DOCUMENT_PRODUCTION_PACKAGE_ID = '00000000-0000-4000-8000-000000000301'

const SEEDED_GENERATION_IDS = [
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000402',
  '00000000-0000-4000-8000-000000000403',
] as const

const SEEDED_VERSION_IDS = [
  '00000000-0000-4000-8000-000000000501',
  '00000000-0000-4000-8000-000000000502',
  '00000000-0000-4000-8000-000000000503',
] as const

const SEEDED_FILE_IDS = [
  '00000000-0000-4000-8000-000000000601',
  '00000000-0000-4000-8000-000000000602',
  '00000000-0000-4000-8000-000000000603',
] as const

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
    const area = references.legalAreas.find(({ name }) => name === 'Cível')
    const topic = references.legalTopics.find(
      ({ legalAreaId, name }) => legalAreaId === area?.id && name === 'Contratos',
    )
    if (!area || !topic) {
      throw new AppError(
        'Document Production seed references are required.',
        'Seed Error',
      )
    }

    const templates: readonly DocumentTemplateSeed[] = references.hasPendingDocumentData
      ? [PENDING_MARKERS_TEMPLATE]
      : DOCUMENT_TEMPLATES
    const specificationCreations: DocumentSpecificationCreation[] = templates.map(
      (template) => ({
        name: template.name,
        description: template.description,
        content: this.createTemplateContent(template.name, template.paragraphs),
        variables: [...template.variables],
        application: {
          scope: 'legal_context',
          moment: 'consultation',
          legalAreaIds: [area.id],
          legalTopicIdsByArea: { [area.id]: [topic.id] },
        },
        status: 'available',
      }),
    )
    const specifications =
      await this.specificationsRepository.addMany(specificationCreations)
    const retirementArea = references.legalAreas.find(
      ({ name }) => name === UNIVERSAL_RETIREMENT_TEMPLATE.legalAreaName,
    )
    const retirementTopic = references.legalTopics.find(
      ({ legalAreaId, name }) =>
        legalAreaId === retirementArea?.id &&
        name === UNIVERSAL_RETIREMENT_TEMPLATE.legalTopicName,
    )
    const universalRetirementSpecification = await this.specificationsRepository.add({
      name: UNIVERSAL_RETIREMENT_TEMPLATE.name,
      description: UNIVERSAL_RETIREMENT_TEMPLATE.description,
      content: UNIVERSAL_RETIREMENT_TEMPLATE.content,
      variables: [...UNIVERSAL_RETIREMENT_TEMPLATE.variables],
      application:
        retirementArea && retirementTopic
          ? {
              scope: 'legal_context',
              moment: UNIVERSAL_RETIREMENT_TEMPLATE.moment,
              legalAreaIds: [retirementArea.id],
              legalTopicIdsByArea: { [retirementArea.id]: [retirementTopic.id] },
            }
          : {
              scope: 'global',
              moment: UNIVERSAL_RETIREMENT_TEMPLATE.moment,
            },
      status: 'available',
    })
    const documentCreations: DocumentCreation[] = specifications.map((specification) => {
      const template = templates.find(({ name }) => name === specification.name)
      if (!template) {
        throw new AppError(
          'A seeded Document Template could not be resolved.',
          'Seed Error',
        )
      }

      const {
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...document
      } = DocumentFaker.fake({
        id: template.documentId,
        title: specification.name,
      })
      return document
    })
    const documents = await this.documentsRepository.addMany(documentCreations)
    const seededPackage = DocumentPackageFaker.fake({
      id: references.hasPendingDocumentData
        ? '00000000-0000-4000-8000-000000000302'
        : DOCUMENT_PRODUCTION_PACKAGE_ID,
      context: {
        type: 'consultation',
        consultationId: references.consultationId,
      },
    })
    const documentPackageCreation: DocumentPackageCreation = {
      id: seededPackage.id,
      context: seededPackage.context,
    }
    const documentPackage = await this.documentPackagesRepository.add(
      documentPackageCreation,
    )
    const packageDocumentCreations: PackageDocumentCreation[] = documents.map(
      (document, index) => {
        const specification = specifications[index]
        if (!specification) {
          throw new AppError(
            'A Document Specification is missing from the seeded package.',
            'Seed Error',
          )
        }

        const {
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          ...packageDocument
        } = PackageDocumentFaker.fake({
          documentPackageId: documentPackage.id,
          documentId: document.id,
          documentSpecificationId: specification.id,
        })
        return packageDocument
      },
    )
    const packageDocuments = await this.packageDocumentsRepository.addMany(
      packageDocumentCreations,
    )

    const generatedDocuments = references.requestedByCollaboratorId
      ? await this.seedDocumentVersions({
          hasPendingDocumentData: references.hasPendingDocumentData,
          documents,
          specifications,
          consultationId: references.consultationId,
          requestedByCollaboratorId: references.requestedByCollaboratorId,
        })
      : { generations: [], versions: [] }

    return {
      specifications,
      universalRetirementSpecification,
      documents,
      documentPackage,
      packageDocuments,
      ...generatedDocuments,
    }
  }

  private async seedDocumentVersions({
    hasPendingDocumentData,
    documents,
    specifications,
    consultationId,
    requestedByCollaboratorId,
  }: {
    readonly hasPendingDocumentData?: boolean
    readonly documents: readonly { id: string; title: string }[]
    readonly specifications: readonly {
      id: string
      name: string
      content: DocumentTemplateContent
      variables: readonly DocumentTemplateVariable[]
    }[]
    readonly consultationId: string
    readonly requestedByCollaboratorId: string
  }) {
    const startedAt = new Date('2026-08-20T15:05:00.000Z')
    const reviewedAt = new Date('2026-08-20T15:10:00.000Z')
    const generations: DocumentGeneration[] = []
    const versions: DocumentVersion[] = []

    for (const [index, document] of documents.entries()) {
      const specification = specifications[index]
      const generationId = hasPendingDocumentData
        ? '00000000-0000-4000-8000-000000000404'
        : SEEDED_GENERATION_IDS[index]
      const versionId = hasPendingDocumentData
        ? '00000000-0000-4000-8000-000000000504'
        : SEEDED_VERSION_IDS[index]
      const fileId = hasPendingDocumentData
        ? '00000000-0000-4000-8000-000000000604'
        : SEEDED_FILE_IDS[index]

      if (!specification || !generationId || !versionId || !fileId) {
        throw new AppError(
          'The generated document seed references could not be resolved.',
          'Seed Error',
        )
      }

      const generated = DocumentGenerationFaker.fake({
        id: generationId,
        documentId: document.id,
        documentSpecificationVersionId: specification.id,
        requestedByCollaboratorId,
        source: {
          type: 'consultation',
          id: consultationId,
          data: { documentTitle: document.title },
        },
        template: {
          name: specification.name,
          content: specification.content,
          variables: specification.variables,
        },
        status: 'pending',
        attemptsCount: 0,
        findings: [],
      })
      const generationCreation: DocumentGenerationCreation = {
        id: generated.id,
        documentId: generated.documentId,
        documentSpecificationVersionId: generated.documentSpecificationVersionId,
        requestedByCollaboratorId: generated.requestedByCollaboratorId,
        source: generated.source,
        template: generated.template,
        status: generated.status,
        attemptsCount: generated.attemptsCount,
        findings: generated.findings,
      }
      const createdGeneration = await this.generationsRepository.add(generationCreation)
      const runningGeneration = await this.generationsRepository.replace(
        createdGeneration.id,
        {
          status: 'running',
          attemptsCount: 1,
          findings: [],
          startedAt,
          updatedAt: startedAt,
        },
        ['pending'],
      )

      if (!runningGeneration) {
        throw new AppError(
          'The seeded document generation could not be started.',
          'Seed Error',
        )
      }

      const version = DocumentVersionFaker.fake({
        id: versionId,
        documentId: document.id,
        documentGenerationId: createdGeneration.id,
        fileId,
        versionNumber: 1,
        source: 'ai',
        content: specification.content,
        pendingMarkers: hasPendingDocumentData
          ? await new FindDocumentPendingMarkersUseCase().execute({
              content: specification.content,
            })
          : [],
        createdByCollaboratorId: requestedByCollaboratorId,
        createdAt: startedAt,
        status: 'in_review',
      })
      const versionCreation: DocumentVersionCreation = {
        id: version.id,
        documentId: version.documentId,
        documentGenerationId: version.documentGenerationId,
        fileId: version.fileId,
        versionNumber: version.versionNumber,
        source: version.source,
        content: version.content,
        pendingMarkers: version.pendingMarkers,
        createdByCollaboratorId: version.createdByCollaboratorId,
        createdAt: version.createdAt,
        status: version.status,
      }
      const createdVersion = await this.versionsRepository.add(versionCreation)
      const seededVersion = hasPendingDocumentData
        ? createdVersion
        : await this.versionsRepository.review(
            createdVersion.id,
            'approved',
            requestedByCollaboratorId,
            reviewedAt,
          )

      if (!seededVersion) {
        throw new AppError(
          'The seeded document version could not be approved.',
          'Seed Error',
        )
      }

      const completedGeneration = await this.generationsRepository.replace(
        createdGeneration.id,
        {
          status: 'completed',
          attemptsCount: 1,
          findings: [],
          documentVersionId: seededVersion.id,
          completedAt: reviewedAt,
          updatedAt: reviewedAt,
        },
        ['running'],
      )

      if (!completedGeneration) {
        throw new AppError(
          'The seeded document generation could not be completed.',
          'Seed Error',
        )
      }

      generations.push(completedGeneration)
      versions.push(seededVersion)
    }

    return { generations, versions }
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
