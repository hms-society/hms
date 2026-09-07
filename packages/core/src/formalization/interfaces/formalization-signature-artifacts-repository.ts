import type { FormalizationSignatureArtifact } from '../domain/entities'
export interface FormalizationSignatureArtifactsRepository {
  add(artifact: FormalizationSignatureArtifact): Promise<void>
  findByRequestId(requestId: string): Promise<FormalizationSignatureArtifact[]>
  findByRequestDocumentId(
    requestDocumentId: string,
  ): Promise<FormalizationSignatureArtifact[]>
}
