import type { UseCase } from "#shared/interfaces/use-case.ts";
import type { DocumentBatchFile } from "../domain/entities";
import { DocumentFileNotFoundError } from "../domain/error";
import type { DocumentBatchesRepository } from "../interfaces";

type Request = {
    fileId: string
}

export class GetDocumentFileUseCase implements UseCase<Request, DocumentBatchFile> {
    constructor(private readonly documentBatchRepository: DocumentBatchesRepository){}

    async execute({fileId}: Request): Promise<DocumentBatchFile> {
        const file = await this.documentBatchRepository.findFileById(fileId)

        if(!file){ throw new DocumentFileNotFoundError()}
        return file
    }
}