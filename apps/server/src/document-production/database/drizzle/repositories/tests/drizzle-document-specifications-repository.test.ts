import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { DocumentSpecificationCreation } from '@hms/core/document-production/domain/entities'
import type { DocumentTemplateContent } from '@hms/core/document-production/domain/structures'

import { DocumentProductionModuleFixture } from '@/document-production/fixtures'

describe('Document Specifications Repository', () => {
  let fixture: DocumentProductionModuleFixture

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register()
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('persists seeded documents, variables, and legal associations', async () => {
    const catalog = await fixture.seedCatalog()
    const seeded = await fixture.specificationsSeeder.run({
      legalAreas: catalog.areas,
      legalTopics: catalog.topics,
    })

    expect(seeded).toHaveLength(3)
    const legalSpecification = seeded.find(
      ({ application }) => application.scope === 'legal_context',
    )
    if (!legalSpecification) throw new Error('Legal specification was not seeded')

    const persisted = await fixture.specificationsRepository.findById(
      legalSpecification.id,
    )

    expect(persisted).toMatchObject({
      id: legalSpecification.id,
      content: legalSpecification.content,
      variables: [],
      application: {
        scope: 'legal_context',
        legalAreaIds: [catalog.areas[1]?.id],
        legalTopicIdsByArea: {
          [catalog.areas[1]?.id ?? '']: [
            catalog.topics.find(
              ({ legalAreaId, name }) =>
                legalAreaId === catalog.areas[1]?.id && name === 'Contratos',
            )?.id,
          ],
        },
      },
    })
  })

  it('rolls back a create when association insertion fails', async () => {
    const areaId = '00000000-0000-0000-0000-000000000001'
    const specification = createSpecification({
      application: {
        scope: 'legal_context',
        moment: 'consultation',
        legalAreaIds: [areaId, areaId],
        legalTopicIdsByArea: {},
      },
    })

    await expect(fixture.specificationsRepository.add(specification)).rejects.toThrow()

    const result = await fixture.specificationsRepository.list({ page: 1, pageSize: 20 })
    expect(result.total).toBe(0)
  })

  it('rolls back a configuration update and preserves the previous associations', async () => {
    const catalog = await fixture.seedCatalog()
    const area = catalog.areas[1]
    const topic = catalog.topics.find(({ legalAreaId }) => legalAreaId === area?.id)
    if (!area || !topic) throw new Error('Fixture legal references were not seeded')

    const created = await fixture.specificationsRepository.add(
      createSpecification({
        application: {
          scope: 'legal_context',
          moment: 'consultation',
          legalAreaIds: [area.id],
          legalTopicIdsByArea: { [area.id]: [topic.id] },
        },
      }),
    )

    await expect(
      fixture.specificationsRepository.replaceConfiguration(created.id, {
        name: 'Nome que não deve persistir',
        description: 'Descrição que não deve persistir',
        application: {
          scope: 'legal_context',
          moment: 'formalization',
          legalAreaIds: [area.id, area.id],
          legalTopicIdsByArea: {},
        },
        isRequired: true,
        status: 'available',
      }),
    ).rejects.toThrow()

    const persisted = await fixture.specificationsRepository.findById(created.id)
    expect(persisted).toMatchObject({
      name: 'Modelo de teste',
      description: 'Descrição de teste',
      application: {
        moment: 'consultation',
        legalAreaIds: [area.id],
        legalTopicIdsByArea: { [area.id]: [topic.id] },
      },
      isRequired: false,
    })
  })

  it('updates the document and variables without changing configuration associations', async () => {
    const catalog = await fixture.seedCatalog()
    const area = catalog.areas[1]
    const topic = catalog.topics.find(({ legalAreaId }) => legalAreaId === area?.id)
    if (!area || !topic) throw new Error('Fixture legal references were not seeded')

    const created = await fixture.specificationsRepository.add(
      createSpecification({
        application: {
          scope: 'legal_context',
          moment: 'consultation',
          legalAreaIds: [area.id],
          legalTopicIdsByArea: { [area.id]: [topic.id] },
        },
      }),
    )
    const updatedContent = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Atualizado' }] }],
    } as unknown as DocumentTemplateContent

    await fixture.specificationsRepository.replaceTemplate(created.id, {
      content: updatedContent,
      variables: [{ label: 'Número do processo', technicalName: 'numero_processo' }],
    })

    const persisted = await fixture.specificationsRepository.findById(created.id)
    expect(persisted).toMatchObject({
      content: updatedContent,
      variables: [{ label: 'Número do processo', technicalName: 'numero_processo' }],
      application: {
        scope: 'legal_context',
        moment: 'consultation',
        legalAreaIds: [area.id],
        legalTopicIdsByArea: { [area.id]: [topic.id] },
      },
    })
  })
})

function createSpecification(
  overrides: Partial<DocumentSpecificationCreation> = {},
): DocumentSpecificationCreation {
  return {
    name: 'Modelo de teste',
    description: 'Descrição de teste',
    content: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Conteúdo' }] }],
    } as unknown as DocumentTemplateContent,
    variables: [],
    application: { scope: 'global', moment: 'consultation' },
    isRequired: false,
    status: 'unavailable',
    ...overrides,
  }
}
