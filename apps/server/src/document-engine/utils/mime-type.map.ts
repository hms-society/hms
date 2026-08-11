export const MIME_TYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
}

export function getMimeTypeFromExtension(extension: string): string {
  const normalizedExtension = extension.toLowerCase().replace('.', '')
  return MIME_TYPE_MAP[normalizedExtension] || 'application/octet-stream'
}
