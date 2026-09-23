import { Inject, Injectable } from '@nestjs/common'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
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
import type { FileStorageProvider } from '@hms/core/shared/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

export type DocumentProductionSeedReferences = {
  readonly legalAreas: readonly { id: string; name: string }[]
  readonly legalTopics: readonly { id: string; legalAreaId: string; name: string }[]
  readonly consultationId: string
  readonly caseId?: string
  readonly caseName?: string
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
    name: 'Requerimento Administrativo de Aposentadoria',
    description: 'Requerimento previdenciário para reconhecimento de tempo de contribuição e concessão de aposentadoria.',
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
    documentId: '00000000-0000-4000-8000-000000000202',
    name: 'Manifestação sobre Tempo de Contribuição',
    description: 'Manifestação previdenciária sobre divergências no tempo de contribuição reconhecido administrativamente.',
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
    documentId: '00000000-0000-4000-8000-000000000203',
    name: 'Petição de Juntada de Documentos',
    description: 'Petição para juntada de documentos complementares ao processo administrativo previdenciário.',
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
] as const satisfies readonly DocumentTemplateSeed[]

const DOCUMENT_PRODUCTION_PACKAGE_ID = '00000000-0000-4000-8000-000000000301'

function sanitizeStorageSegment(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

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

const SEEDED_FILE_NAMES = [
  'requerimento-administrativo-aposentadoria-v1.docx',
  'manifestacao-tempo-contribuicao-v1.docx',
  'peticao-juntada-documentos-v1.docx',
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
    @Inject(PROVISION_PROVIDERS.fileStorage)
    private readonly fileStorageProvider: FileStorageProvider,
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

    const specificationCreations: DocumentSpecificationCreation[] =
      DOCUMENT_TEMPLATES.map((template) => ({
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
      }))
    const specifications =
      await this.specificationsRepository.addMany(specificationCreations)
    const documentCreations: DocumentCreation[] = specifications.map((specification) => {
      const template = DOCUMENT_TEMPLATES.find(({ name }) => name === specification.name)
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
      id: DOCUMENT_PRODUCTION_PACKAGE_ID,
      context: { type: 'consultation', consultationId: references.consultationId },
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

    if (references.caseId) {
      const casePackage = await this.documentPackagesRepository.add({
        id: '00000000-0000-4000-8000-000000000302',
        context: { type: 'case', caseId: references.caseId },
      })
      await this.packageDocumentsRepository.addMany(
        documents.map((document, index) => ({
          ...PackageDocumentFaker.fake({
            documentPackageId: casePackage.id,
            documentId: document.id,
            documentSpecificationId: specifications[index]?.id,
          }),
          documentPackageId: casePackage.id,
        })),
      )
    }

    const generatedDocuments = references.requestedByCollaboratorId
      ? await this.seedApprovedDocumentVersions({
          documents,
          specifications,
          consultationId: references.consultationId,
          caseName: references.caseName,
          requestedByCollaboratorId: references.requestedByCollaboratorId,
        })
      : { generations: [], versions: [] }

    return {
      specifications,
      documents,
      documentPackage,
      packageDocuments,
      ...generatedDocuments,
    }
  }

  private async seedApprovedDocumentVersions({
    documents,
    specifications,
    consultationId,
    caseName,
    requestedByCollaboratorId,
  }: {
    readonly documents: readonly { id: string; title: string }[]
    readonly specifications: readonly {
      id: string
      name: string
      content: DocumentTemplateContent
      variables: readonly DocumentTemplateVariable[]
    }[]
    readonly consultationId: string
    readonly caseName?: string
    readonly requestedByCollaboratorId: string
  }) {
    const startedAt = new Date('2026-08-20T15:05:00.000Z')
    const reviewedAt = new Date('2026-08-20T15:10:00.000Z')
    const generations: DocumentGeneration[] = []
    const versions: DocumentVersion[] = []

    for (const [index, document] of documents.entries()) {
      const specification = specifications[index]
      const generationId = SEEDED_GENERATION_IDS[index]
      const versionId = SEEDED_VERSION_IDS[index]
      const fileName = SEEDED_FILE_NAMES[index]

      if (!specification || !generationId || !versionId || !fileName) {
        throw new AppError(
          'The generated document seed references could not be resolved.',
          'Seed Error',
        )
      }

      const fileContent = await readFile(join(process.cwd(), 'src/document-production/database/seed-assets', fileName))
      const safeCaseName = sanitizeStorageSegment(caseName ?? 'case')
      const storedFile = await this.fileStorageProvider.save({
        filePath: `cases/${safeCaseName}/pieces/${document.id}/versions/${versionId}/${fileName}`,
        fileName,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeInBytes: fileContent.byteLength,
        content: new Uint8Array(fileContent),
      })

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
        fileId: storedFile.id,
        versionNumber: 1,
        source: 'ai',
        content: specification.content,
        pendingMarkers: [],
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
      const completedGeneration = await this.generationsRepository.replace(
        createdGeneration.id,
        {
          status: 'completed',
          attemptsCount: 1,
          findings: [],
          documentVersionId: createdVersion.id,
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
      versions.push(createdVersion)
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
