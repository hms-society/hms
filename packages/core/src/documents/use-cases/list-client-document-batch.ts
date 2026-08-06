import type { DocumentBatchesRepository } from "../interfaces";

export class listClientDocumentBatch{
    constructor(private readonly documentBatchRepository: DocumentBatchesRepository){}

    async execute(clientId: string){
        return await this.documentBatchRepository.findById(clientId)
    }
}

