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
  DocumentGenerationSource,
  DocumentTemplateContent,
  DocumentTemplateVariable,
} from '@hms/core/document-production/domain/structures'
import type { File } from '@hms/core/shared/domain/entities'
import type {
  DocumentGenerationsRepository,
  DocumentPackagesRepository,
  DocumentsRepository,
  DocumentSpecificationsRepository,
  DocumentVersionsRepository,
  FrozenDocumentPdfsRepository,
  PackageDocumentsRepository,
} from '@hms/core/document-production/interfaces'
import { AppError } from '@hms/core/shared/domain/errors'
import type { StorageProvider, StoredFilesRepository } from '@hms/core/shared/interfaces'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'
import { STORED_FILES_REPOSITORY } from '@/shared/database/drizzle/database.module'
import { PROVISION_PROVIDERS } from '@/shared/provision/constants/provision-providers'

export type DocumentProductionSeedReferences = {
  readonly legalAreas: readonly { id: string; name: string }[]
  readonly legalTopics: readonly { id: string; legalAreaId: string; name: string }[]
  readonly consultationId: string
  readonly formalizationId?: string
  readonly formalizationContractFormRevision?: number
  readonly requestedByCollaboratorId?: string
}

export type CompletedFormalizationDocumentSeedReferences = {
  readonly legalAreas: readonly { id: string; name: string }[]
  readonly legalTopics: readonly { id: string; legalAreaId: string; name: string }[]
  readonly formalizationId: string
  readonly formalizationContractFormRevision: number
  readonly requestedByCollaboratorId: string
}

type DocumentTemplateSeed = {
  readonly documentId: string
  readonly name: string
  readonly description: string
  readonly paragraphs: readonly string[]
  readonly variables: readonly DocumentTemplateVariable[]
}

type ClearableFrozenDocumentPdfsRepository = FrozenDocumentPdfsRepository & {
  removeAll(): Promise<void>
}

@Injectable()
export class DocumentProductionSeeder {
  static readonly DOCUMENT_TEMPLATES = [
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
  static readonly DOCUMENT_PRODUCTION_PACKAGE_ID = '00000000-0000-4000-8000-000000000301'
  static readonly FORMALIZATION_DOCUMENT_PACKAGE_ID =
    '00000000-0000-4000-8000-000000000302'
  static readonly FORMALIZATION_DOCUMENT_TEMPLATES = [
    {
      documentId: '00000000-0000-4000-8000-000000000204',
      packageDocumentId: '00000000-0000-4000-8000-000000000604',
      name: 'Contrato de formalização',
      description: 'Documento de apoio para a formalização das condições comerciais.',
      paragraphs: [
        'As condições comerciais foram registradas a partir da formalização do atendimento.',
        'Cliente: {cliente_nome}.',
        'Área jurídica: {area_juridica}. Tema jurídico: {tema_juridico}.',
      ],
      variables: [
        { label: 'Nome do cliente', technicalName: 'cliente_nome' },
        { label: 'Área jurídica', technicalName: 'area_juridica' },
        { label: 'Tema jurídico', technicalName: 'tema_juridico' },
      ],
    },
    {
      documentId: '00000000-0000-4000-8000-000000000205',
      packageDocumentId: '00000000-0000-4000-8000-000000000605',
      name: 'Termo de honorários',
      description: 'Termo complementar com as condições de honorários da contratação.',
      paragraphs: [
        'Os honorários e as condições de pagamento foram registrados para este atendimento.',
        'Cliente: {cliente_nome}.',
        'Tema jurídico: {tema_juridico}.',
      ],
      variables: [
        { label: 'Nome do cliente', technicalName: 'cliente_nome' },
        { label: 'Tema jurídico', technicalName: 'tema_juridico' },
      ],
    },
  ] as const satisfies readonly (Omit<DocumentTemplateSeed, 'documentId'> & {
    readonly documentId: string
    readonly packageDocumentId: string
  })[]
  static readonly SEEDED_GENERATION_IDS = [
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000403',
  ] as const
  static readonly SEEDED_VERSION_IDS = [
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000502',
    '00000000-0000-4000-8000-000000000503',
  ] as const
  static readonly SEEDED_FILE_IDS = [
    '00000000-0000-4000-8000-000000000601',
    '00000000-0000-4000-8000-000000000602',
    '00000000-0000-4000-8000-000000000603',
  ] as const
  static readonly SEEDED_FORMALIZATION_GENERATION_IDS = [
    '00000000-0000-4000-8000-000000000404',
    '00000000-0000-4000-8000-000000000405',
  ] as const
  static readonly SEEDED_FORMALIZATION_VERSION_IDS = [
    '00000000-0000-4000-8000-000000000504',
    '00000000-0000-4000-8000-000000000505',
  ] as const
  static readonly SEEDED_FORMALIZATION_FILE_IDS = [
    '00000000-0000-4000-8000-000000000606',
    '00000000-0000-4000-8000-000000000607',
  ] as const
  static readonly COMPLETED_FORMALIZATION_DOCUMENT_TEMPLATES =
    DocumentProductionSeeder.FORMALIZATION_DOCUMENT_TEMPLATES.map((template, index) => ({
      ...template,
      documentId: `00000000-0000-4000-8000-00000000020${index + 6}`,
      packageDocumentId: `00000000-0000-4000-8000-00000000060${index + 8}`,
    }))
  static readonly COMPLETED_FORMALIZATION_DOCUMENT_PACKAGE_ID =
    '00000000-0000-4000-8000-000000000303'
  static readonly COMPLETED_FORMALIZATION_GENERATION_IDS = [
    '00000000-0000-4000-8000-000000000406',
    '00000000-0000-4000-8000-000000000407',
  ] as const
  static readonly COMPLETED_FORMALIZATION_VERSION_IDS = [
    '00000000-0000-4000-8000-000000000506',
    '00000000-0000-4000-8000-000000000507',
  ] as const
  static readonly COMPLETED_FORMALIZATION_FILE_IDS = [
    '00000000-0000-4000-8000-000000000610',
    '00000000-0000-4000-8000-000000000611',
  ] as const
  static readonly COMPLETED_FORMALIZATION_ORIGINAL_PDF_FILE_IDS = [
    '00000000-0000-4000-8000-000000000612',
    '00000000-0000-4000-8000-000000000613',
  ] as const
  static readonly COMPLETED_FORMALIZATION_SIGNED_PDF_FILE_IDS = [
    '00000000-0000-4000-8000-000000000614',
    '00000000-0000-4000-8000-000000000615',
  ] as const
  static readonly SEEDED_FORMALIZATION_PACKAGE_CONFIRMATION_DATE = new Date(
    '2026-08-20T15:20:00.000Z',
  )

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
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.frozenPdfs)
    private readonly frozenPdfsRepository: ClearableFrozenDocumentPdfsRepository,
    @Inject(STORED_FILES_REPOSITORY)
    private readonly storedFilesRepository: StoredFilesRepository,
    @Inject(PROVISION_PROVIDERS.storage)
    private readonly storageProvider: StorageProvider,
  ) {}

  async clear() {
    await this.clearFormalizationSeedFiles()
    await this.packageDocumentsRepository.removeAll()
    await this.frozenPdfsRepository.removeAll()
    await this.versionsRepository.removeAll()
    await this.generationsRepository.removeAll()
    await this.documentPackagesRepository.removeAll()
    await this.documentsRepository.removeAll()
    await this.specificationsRepository.removeAll()
  }

  async runCompletedFormalization(
    references: CompletedFormalizationDocumentSeedReferences,
  ) {
    const { areaId, topicId } = this.resolveFormalizationLegalContext(references)
    const fixture = await this.seedFormalizationFixture({
      areaId,
      topicId,
      formalizationId: references.formalizationId,
      documentTemplates:
        DocumentProductionSeeder.COMPLETED_FORMALIZATION_DOCUMENT_TEMPLATES,
      documentPackageId:
        DocumentProductionSeeder.COMPLETED_FORMALIZATION_DOCUMENT_PACKAGE_ID,
    })
    const fileIds = await this.seedFormalizationFiles({
      documents: fixture.formalizationDocuments,
      generationIds: DocumentProductionSeeder.COMPLETED_FORMALIZATION_GENERATION_IDS,
      fileIds: DocumentProductionSeeder.COMPLETED_FORMALIZATION_FILE_IDS,
    })
    const signaturePdfFileIds = await this.seedCompletedSignaturePdfFiles(
      fixture.formalizationDocuments,
    )
    const generated = await this.seedApprovedDocumentVersions({
      documents: fixture.formalizationDocuments,
      specifications: fixture.formalizationSpecifications,
      source: {
        type: 'formalization',
        id: references.formalizationId,
        data: {
          formalization: {
            id: references.formalizationId,
            contractFormRevision: references.formalizationContractFormRevision,
          },
        },
      },
      requestedByCollaboratorId: references.requestedByCollaboratorId,
      generationIds: DocumentProductionSeeder.COMPLETED_FORMALIZATION_GENERATION_IDS,
      versionIds: DocumentProductionSeeder.COMPLETED_FORMALIZATION_VERSION_IDS,
      fileIds,
    })
    const confirmedPackage = await this.documentPackagesRepository.confirm(
      fixture.formalizationPackage.id,
      references.requestedByCollaboratorId,
      DocumentProductionSeeder.SEEDED_FORMALIZATION_PACKAGE_CONFIRMATION_DATE,
    )
    if (!confirmedPackage) {
      throw new AppError(
        'The completed Formalization document package could not be confirmed.',
        'Seed Error',
      )
    }

    return {
      ...fixture,
      formalizationGenerations: generated.generations,
      formalizationVersions: generated.versions,
      signaturePdfFileIds,
    }
  }

  async run(references: DocumentProductionSeedReferences) {
    if (
      references.formalizationId &&
      references.formalizationContractFormRevision === undefined
    ) {
      throw new AppError(
        'The Formalization document seed requires the current form revision.',
        'Seed Error',
      )
    }

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
      DocumentProductionSeeder.DOCUMENT_TEMPLATES.map((template) => ({
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
      const template = DocumentProductionSeeder.DOCUMENT_TEMPLATES.find(
        ({ name }) => name === specification.name,
      )
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
      id: DocumentProductionSeeder.DOCUMENT_PRODUCTION_PACKAGE_ID,
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

    const formalizationFixture = references.formalizationId
      ? await this.seedFormalizationFixture({
          areaId: area.id,
          topicId: topic.id,
          formalizationId: references.formalizationId,
          documentTemplates: DocumentProductionSeeder.FORMALIZATION_DOCUMENT_TEMPLATES,
          documentPackageId: DocumentProductionSeeder.FORMALIZATION_DOCUMENT_PACKAGE_ID,
        })
      : undefined

    const generatedDocuments = references.requestedByCollaboratorId
      ? await this.seedApprovedDocumentVersions({
          documents,
          specifications,
          source: { type: 'consultation', id: references.consultationId, data: {} },
          requestedByCollaboratorId: references.requestedByCollaboratorId,
          generationIds: DocumentProductionSeeder.SEEDED_GENERATION_IDS,
          versionIds: DocumentProductionSeeder.SEEDED_VERSION_IDS,
          fileIds: DocumentProductionSeeder.SEEDED_FILE_IDS,
        })
      : { generations: [], versions: [] }

    const generatedFormalizationDocuments =
      references.requestedByCollaboratorId &&
      formalizationFixture &&
      references.formalizationId
        ? await this.seedApprovedDocumentVersions({
            documents: formalizationFixture.formalizationDocuments,
            specifications: formalizationFixture.formalizationSpecifications,
            source: {
              type: 'formalization',
              id: references.formalizationId,
              data: {
                formalization: {
                  id: references.formalizationId,
                  contractFormRevision: references.formalizationContractFormRevision,
                },
              },
            },
            requestedByCollaboratorId: references.requestedByCollaboratorId,
            generationIds: DocumentProductionSeeder.SEEDED_FORMALIZATION_GENERATION_IDS,
            versionIds: DocumentProductionSeeder.SEEDED_FORMALIZATION_VERSION_IDS,
            fileIds: await this.seedFormalizationFiles({
              documents: formalizationFixture.formalizationDocuments,
              generationIds: DocumentProductionSeeder.SEEDED_FORMALIZATION_GENERATION_IDS,
              fileIds: DocumentProductionSeeder.SEEDED_FORMALIZATION_FILE_IDS,
            }),
          })
        : { generations: [], versions: [] }

    if (formalizationFixture && references.requestedByCollaboratorId) {
      const confirmedPackage = await this.documentPackagesRepository.confirm(
        formalizationFixture.formalizationPackage.id,
        references.requestedByCollaboratorId,
        DocumentProductionSeeder.SEEDED_FORMALIZATION_PACKAGE_CONFIRMATION_DATE,
      )
      if (!confirmedPackage) {
        throw new AppError(
          'The Formalization document package could not be confirmed.',
          'Seed Error',
        )
      }
    }

    return {
      specifications,
      documents,
      documentPackage,
      packageDocuments,
      ...(formalizationFixture ?? {}),
      ...generatedDocuments,
      formalizationGenerations: generatedFormalizationDocuments.generations,
      formalizationVersions: generatedFormalizationDocuments.versions,
    }
  }

  private async seedFormalizationFixture({
    areaId,
    topicId,
    formalizationId,
    documentTemplates,
    documentPackageId,
  }: {
    readonly areaId: string
    readonly topicId: string
    readonly formalizationId: string
    readonly documentTemplates: readonly (typeof DocumentProductionSeeder.COMPLETED_FORMALIZATION_DOCUMENT_TEMPLATES)[number][]
    readonly documentPackageId: string
  }) {
    const specifications = await this.specificationsRepository.addMany(
      documentTemplates.map((template) => ({
        name: template.name,
        description: template.description,
        content: this.createTemplateContent(template.name, template.paragraphs),
        variables: [...template.variables],
        application: {
          scope: 'legal_context' as const,
          moment: 'formalization' as const,
          legalAreaIds: [areaId],
          legalTopicIdsByArea: { [areaId]: [topicId] },
        },
        status: 'available' as const,
      })),
    )

    if (specifications.length !== documentTemplates.length) {
      throw new AppError(
        'The Formalization document specifications could not be seeded.',
        'Seed Error',
      )
    }

    const documents = documentTemplates.map((template) => {
      const {
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...document
      } = DocumentFaker.fake({
        id: template.documentId,
        title: template.name,
      })
      return document
    })
    const formalizationDocuments = await this.documentsRepository.addMany(documents)

    if (formalizationDocuments.length !== documents.length) {
      throw new AppError('The Formalization documents could not be seeded.', 'Seed Error')
    }

    const seededPackage = DocumentPackageFaker.fake({
      id: documentPackageId,
      context: { type: 'formalization', formalizationId },
    })
    const formalizationPackage = await this.documentPackagesRepository.add({
      id: seededPackage.id,
      context: seededPackage.context,
    })
    const packageDocuments = documentTemplates.map((template, index) => {
      const document = formalizationDocuments[index]
      const specification = specifications[index]
      if (!document || !specification) {
        throw new AppError(
          'A Formalization document reference could not be resolved.',
          'Seed Error',
        )
      }

      const {
        createdAt: _packageDocumentCreatedAt,
        updatedAt: _packageDocumentUpdatedAt,
        ...packageDocument
      } = PackageDocumentFaker.fake({
        id: template.packageDocumentId,
        documentPackageId: formalizationPackage.id,
        documentId: document.id,
        documentSpecificationId: specification.id,
      })
      return packageDocument
    })
    const formalizationPackageDocuments =
      await this.packageDocumentsRepository.addMany(packageDocuments)

    return {
      formalizationSpecifications: specifications,
      formalizationDocuments,
      formalizationPackage,
      formalizationPackageDocuments,
    }
  }

  private async clearFormalizationSeedFiles() {
    const fileIds = [
      ...DocumentProductionSeeder.SEEDED_FORMALIZATION_FILE_IDS,
      ...DocumentProductionSeeder.COMPLETED_FORMALIZATION_FILE_IDS,
      ...DocumentProductionSeeder.COMPLETED_FORMALIZATION_ORIGINAL_PDF_FILE_IDS,
      ...DocumentProductionSeeder.COMPLETED_FORMALIZATION_SIGNED_PDF_FILE_IDS,
    ]
    for (const fileId of fileIds) {
      const file = await this.storedFilesRepository.findById(fileId)
      if (!file) continue

      await this.storageProvider.remove(file.filePath)
      await this.storedFilesRepository.remove(file.id)
    }
  }

  private async seedCompletedSignaturePdfFiles(
    documents: readonly { id: string; title: string }[],
  ) {
    const original: string[] = []
    const signed: string[] = []

    for (const [index, document] of documents.entries()) {
      const originalFileId =
        DocumentProductionSeeder.COMPLETED_FORMALIZATION_ORIGINAL_PDF_FILE_IDS[index]
      const signedFileId =
        DocumentProductionSeeder.COMPLETED_FORMALIZATION_SIGNED_PDF_FILE_IDS[index]
      if (!originalFileId || !signedFileId) {
        throw new AppError(
          'The completed Formalization signature PDF references could not be resolved.',
          'Seed Error',
        )
      }

      original.push(
        await this.seedCompletedSignaturePdf({
          fileId: originalFileId,
          filePath: `formalization/${document.id}/signature/original.pdf`,
          fileName: `${document.title}-original.pdf`,
          label: `${document.title} - original`,
        }),
      )
      signed.push(
        await this.seedCompletedSignaturePdf({
          fileId: signedFileId,
          filePath: `formalization/${document.id}/signature/signed.pdf`,
          fileName: `${document.title}-assinado.pdf`,
          label: `${document.title} - assinado`,
        }),
      )
    }

    return { original, signed }
  }

  private async seedCompletedSignaturePdf(input: {
    readonly fileId: string
    readonly filePath: string
    readonly fileName: string
    readonly label: string
  }) {
    const content = this.createSeedPdf(input.label)
    await this.storageProvider.upload(input.filePath, content, 'application/pdf')
    try {
      await this.storedFilesRepository.add({
        id: input.fileId,
        filePath: input.filePath,
        fileName: input.fileName,
        contentType: 'application/pdf',
        sizeInBytes: content.byteLength,
        createdAt:
          DocumentProductionSeeder.SEEDED_FORMALIZATION_PACKAGE_CONFIRMATION_DATE,
      })
    } catch (error) {
      await this.storageProvider.remove(input.filePath)
      throw error
    }
    return input.fileId
  }

  private createSeedPdf(label: string) {
    const safeLabel = label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[()\\]/g, '')
    const stream = `BT /F1 18 Tf 72 760 Td (${safeLabel}) Tj ET`
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]
    let pdf = '%PDF-1.4\n'
    const offsets = [0]
    for (const [index, object] of objects.entries()) {
      offsets.push(pdf.length)
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
    }
    const xrefOffset = pdf.length
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
    pdf += offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
      .join('')
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
    return new TextEncoder().encode(pdf)
  }

  private async seedFormalizationFiles({
    documents,
    generationIds,
    fileIds,
  }: {
    readonly documents: readonly { id: string }[]
    readonly generationIds: readonly string[]
    readonly fileIds: readonly string[]
  }): Promise<readonly string[]> {
    const fileSeeds = [
      {
        id: fileIds[0],
        documentId: documents[0]?.id,
        generationId: generationIds[0],
        fileName: 'contrato-de-formalizacao.docx',
      },
      {
        id: fileIds[1],
        documentId: documents[1]?.id,
        generationId: generationIds[1],
        fileName: 'termo-de-honorarios.docx',
      },
    ] as const

    return Promise.all(
      fileSeeds.map(async ({ id, documentId, generationId, fileName }) => {
        if (!documentId || !generationId) {
          throw new AppError(
            'The seeded formalization file references could not be resolved.',
            'Seed Error',
          )
        }

        const filePath = `document-production/documents/${documentId}/generations/${generationId}/${fileName}`
        const content = new Uint8Array(
          await readFile(join('src/document-production/database/seed-assets', fileName)),
        )
        const contentType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

        await this.storageProvider.upload(filePath, content, contentType)

        const file: File = {
          id,
          filePath,
          fileName,
          contentType,
          sizeInBytes: content.byteLength,
          createdAt:
            DocumentProductionSeeder.SEEDED_FORMALIZATION_PACKAGE_CONFIRMATION_DATE,
        }

        try {
          await this.storedFilesRepository.add(file)
        } catch (error) {
          await this.storageProvider.remove(filePath)
          throw error
        }

        return id
      }),
    )
  }

  private resolveFormalizationLegalContext(references: {
    readonly legalAreas: readonly { id: string; name: string }[]
    readonly legalTopics: readonly { id: string; legalAreaId: string; name: string }[]
  }) {
    const area = references.legalAreas.find(({ name }) => name === 'Cível')
    const topic = references.legalTopics.find(
      ({ legalAreaId, name }) => legalAreaId === area?.id && name === 'Contratos',
    )
    if (!area || !topic) {
      throw new AppError(
        'Completed Formalization document seed references are required.',
        'Seed Error',
      )
    }
    return { areaId: area.id, topicId: topic.id }
  }

  private async seedApprovedDocumentVersions({
    documents,
    specifications,
    source,
    requestedByCollaboratorId,
    generationIds,
    versionIds,
    fileIds,
  }: {
    readonly documents: readonly { id: string; title: string }[]
    readonly specifications: readonly {
      id: string
      name: string
      content: DocumentTemplateContent
      variables: readonly DocumentTemplateVariable[]
    }[]
    readonly source: DocumentGenerationSource
    readonly requestedByCollaboratorId: string
    readonly generationIds: readonly string[]
    readonly versionIds: readonly string[]
    readonly fileIds: readonly string[]
  }) {
    const startedAt = new Date('2026-08-20T15:05:00.000Z')
    const reviewedAt = new Date('2026-08-20T15:10:00.000Z')
    const generations: DocumentGeneration[] = []
    const versions: DocumentVersion[] = []

    for (const [index, document] of documents.entries()) {
      const specification = specifications[index]
      const generationId = generationIds[index]
      const versionId = versionIds[index]
      const fileId = fileIds[index]

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
        source: { ...source, data: { ...source.data, documentTitle: document.title } },
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

      const currentDocument = await this.documentsRepository.replace(document.id, {
        currentVersionId: approvedVersion.id,
      })
      if (!currentDocument) {
        throw new AppError(
          'The seeded document could not be updated with its current version.',
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
