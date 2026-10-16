import type { ChecklistUploadContext } from './checklist-upload-context'
export type PrepareChecklistUpload = ChecklistUploadContext & { operationId: string; name: string; mimeType: string; sizeBytes: number }
