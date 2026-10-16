import type { FormalizationSignatureArtifact } from '../domain/entities'
export interface FormalizationSignatureArtifactsRepository {
  findById(artifactId: string): Promise<FormalizationSignatureArtifact | undefined>
  add(artifact: FormalizationSignatureArtifact): Promise<void>
  findByRequestId(requestId: string): Promise<FormalizationSignatureArtifact[]>
  findByRequestDocumentId(
    requestDocumentId: string,
  ): Promise<FormalizationSignatureArtifact[]>
}
