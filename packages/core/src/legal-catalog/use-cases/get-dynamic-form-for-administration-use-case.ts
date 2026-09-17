import type { UseCase } from '#shared/interfaces/use-case'

import {
  DynamicFormDefinitionValidationError,
  DynamicFormNotFoundError,
} from '../domain/errors'
import type { LegalTopic } from '../domain/entities/legal-topic'
import type { DynamicFormEditorDetails } from '../domain/structures/dynamic-form-editor-details'
import type { DynamicFormAdministrationRepository } from '../interfaces/dynamic-form-administration-repository'
import type { LegalAreasRepository } from '../interfaces/legal-areas-repository'
import type { LegalTopicsRepository } from '../interfaces/legal-topics-repository'

type Request = { dynamicFormId: string }

export class GetDynamicFormForAdministrationUseCase
  implements UseCase<Request, DynamicFormEditorDetails>
{
  constructor(
    private readonly dynamicFormAdministrationRepository: DynamicFormAdministrationRepository,
    private readonly legalAreasRepository: LegalAreasRepository,
    private readonly legalTopicsRepository: LegalTopicsRepository,
  ) {}

  async execute({ dynamicFormId }: Request): Promise<DynamicFormEditorDetails> {
    const form = await this.dynamicFormAdministrationRepository.findById(dynamicFormId)
    if (!form) throw new DynamicFormNotFoundError(dynamicFormId)

    const [areas, topics] = await Promise.all([
      this.legalAreasRepository.findByIds([form.legalAreaId]),
      this.legalTopicsRepository.findByIds(form.legalTopicIds),
    ])
    const legalArea = areas.find((area) => area.id === form.legalAreaId)
    const topicsById = new Map(topics.map((topic) => [topic.id, topic]))
    const legalTopics = form.legalTopicIds.map((topicId) => topicsById.get(topicId))

    if (!legalArea || legalTopics.some((topic) => !topic)) {
      throw new DynamicFormDefinitionValidationError([
        ...(!legalArea
          ? [
              {
                path: 'legalAreaId',
                message: 'A área jurídica selecionada não foi encontrada.',
              },
            ]
          : []),
        ...legalTopics.flatMap((topic, index) =>
          topic
            ? []
            : [
                {
                  path: `legalTopicIds.${index}`,
                  message: 'Um assunto jurídico selecionado não foi encontrado.',
                },
              ],
        ),
      ])
    }

    return { form, legalArea, legalTopics: legalTopics as LegalTopic[] }
  }
}
