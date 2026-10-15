import type { UseCase } from '#shared/interfaces/use-case'
import type { CaseDocumentActorRequest } from '../domain/structures'
import type { ListCaseDocumentsResponse } from './list-case-documents-use-case'
import type { ListCaseDocumentsUseCase } from './list-case-documents-use-case'
import { NotFoundError } from '../../shared/domain/errors/not-found-error'

type Response = ListCaseDocumentsResponse[number]

export class GetCaseDocumentUseCase
  implements UseCase<CaseDocumentActorRequest, Response>
{
  constructor(private readonly listCaseDocuments: ListCaseDocumentsUseCase) {}

  async execute(request: CaseDocumentActorRequest): Promise<Response> {
    const documents = await this.listCaseDocuments.execute(request)
    const document = documents.find(
      ({ document: item }) => item.id === request.documentId,
    )
    if (!document) throw new NotFoundError('Documento não encontrado neste Caso.')
    return document
  }
}
