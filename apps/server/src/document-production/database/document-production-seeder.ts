import { Inject, Injectable } from '@nestjs/common'
import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'
import type { DocumentSpecificationsRepository } from '@hms/core/document-production/interfaces'

import { DOCUMENT_PRODUCTION_REPOSITORIES } from '@/document-production/constants/document-production-repositories'

export type DocumentProductionSeedReferences = {
  readonly legalAreas: readonly { id: string; name: string }[]
  readonly legalTopics: readonly { id: string; legalAreaId: string; name: string }[]
}

type DocumentTemplateSeed = {
  readonly name: string
  readonly description: string
  readonly moment: DocumentSpecificationCreation['application']['moment']
  readonly isRequired: boolean
  readonly scope: 'global' | 'legal_context'
}

function createTemplateContent(name: string): DocumentTemplateContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: `Conteúdo inicial de ${name}` }],
      },
    ],
  } as unknown as DocumentTemplateContent
}

const DOCUMENT_TEMPLATES = [
  {
    name: 'Documento de identificação',
    description: 'Documento oficial de identificação do cliente.',
    moment: 'consultation' as const,
    isRequired: true,
    scope: 'global' as const,
  },
  {
    name: 'Comprovante de residência',
    description: 'Comprovante de residência atualizado.',
    moment: 'formalization' as const,
    isRequired: false,
    scope: 'global' as const,
  },
  {
    name: 'Contrato de prestação de serviços',
    description: 'Instrumento contratual para formalização do atendimento.',
    moment: 'formalization' as const,
    isRequired: true,
    scope: 'legal_context' as const,
  },
] as const satisfies readonly DocumentTemplateSeed[]

@Injectable()
export class DocumentProductionSeeder {
  constructor(
    @Inject(DOCUMENT_PRODUCTION_REPOSITORIES.specifications)
    private readonly specificationsRepository: DocumentSpecificationsRepository,
  ) {}

  clear() {
    return this.specificationsRepository.removeAll()
  }

  seed(specifications: readonly DocumentSpecificationCreation[]) {
    return this.specificationsRepository.addMany(specifications)
  }

  run(references: DocumentProductionSeedReferences) {
    const area = references.legalAreas.find(({ name }) => name === 'Cível')
    const topic = references.legalTopics.find(
      ({ legalAreaId, name }) => legalAreaId === area?.id && name === 'Contratos',
    )
    if (!area || !topic)
      throw new Error('Document production seed references are required')

    const specifications: DocumentSpecificationCreation[] = DOCUMENT_TEMPLATES.map(
      (template) => ({
        ...template,
        content: createTemplateContent(template.name),
        variables: [],
        application:
          template.scope === 'global'
            ? {
                scope: 'global' as const,
                moment: template.moment,
              }
            : {
                scope: 'legal_context' as const,
                moment: template.moment,
                legalAreaIds: [area.id],
                legalTopicIdsByArea: { [area.id]: [topic.id] },
              },
        status: 'available' as const,
      }),
    )

    return this.seed(specifications)
  }
}
