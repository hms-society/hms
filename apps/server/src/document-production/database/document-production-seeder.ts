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
import { AppError } from '@hms/core/shared/domain/errors'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'

export type DocumentProductionSeedReferences = {
  readonly legalAreas: readonly { id: string; name: string }[]
  readonly legalTopics: readonly { id: string; legalAreaId: string; name: string }[]
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
      ? await this.seedApprovedDocumentVersions({
          documents,
          specifications,
          consultationId: references.consultationId,
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
      const fileId = SEEDED_FILE_IDS[index]

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
      const approvedVersion = await this.versionsRepository.review(
        createdVersion.id,
        'approved',
        requestedByCollaboratorId,
        reviewedAt,
      )

      if (!approvedVersion) {
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
          documentVersionId: approvedVersion.id,
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
      versions.push(approvedVersion)
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
