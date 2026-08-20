import type { DynamicForm, DynamicFormListQuery } from '../domain'
import type { DynamicFormsRepository } from '../interfaces'
import type { UseCase } from '../interfaces/use-case'

type ListDynamicFormsRequest = {
  readonly query?: DynamicFormListQuery
}

export class ListDynamicFormsUseCase
  implements UseCase<ListDynamicFormsRequest, DynamicForm[]>
{
  constructor(private readonly dynamicFormsRepository: DynamicFormsRepository) {}

  async execute({ query = {} }: ListDynamicFormsRequest): Promise<DynamicForm[]> {
    const normalizedQuery = this.normalizeQuery(query)
    const forms = await this.dynamicFormsRepository.list()

    return forms
      .filter((form) => form.status === 'available')
      .filter((form) => this.matchesQuery(form, normalizedQuery))
      .sort((left, right) =>
        left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' }),
      )
  }

  private matchesQuery(form: DynamicForm, query: DynamicFormListQuery): boolean {
    if (query.search && !form.name.toLocaleLowerCase('pt-BR').includes(query.search)) {
      return false
    }

    if (!query.legalAreaId && !query.legalTopicId) return true

    return form.contexts.some((context) => {
      if (context.type !== 'legal') return false

      const legalAreaId = context.data.legalAreaId
      const legalTopicIds = context.data.legalTopicIds

      if (query.legalAreaId && legalAreaId !== query.legalAreaId) return false

      return (
        !query.legalTopicId ||
        (Array.isArray(legalTopicIds) && legalTopicIds.includes(query.legalTopicId))
      )
    })
  }

  private normalizeQuery(query: DynamicFormListQuery): DynamicFormListQuery {
    const search = query.search?.trim().toLocaleLowerCase('pt-BR')
    const legalAreaId = query.legalAreaId?.trim()
    const legalTopicId = query.legalTopicId?.trim()

    return {
      ...(search ? { search } : {}),
      ...(legalAreaId ? { legalAreaId } : {}),
      ...(legalTopicId ? { legalTopicId } : {}),
    }
  }
}
