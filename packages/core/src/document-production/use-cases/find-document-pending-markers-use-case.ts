import type { UseCase } from '#shared/interfaces/use-case'

import type { DocumentPendingMarker } from '../domain/structures'

type Request = {
  readonly content: unknown
}

export class FindDocumentPendingMarkersUseCase
  implements UseCase<Request, DocumentPendingMarker[]>
{
  private static readonly PENDING_MARKER_PATTERN = /\{[a-z][a-z0-9_]*\}/g

  async execute({ content }: Request): Promise<DocumentPendingMarker[]> {
    const markers = new Set<string>()
    this.collectPendingMarkers(content, markers)

    return [...markers].sort().map((marker) => ({ marker }))
  }

  private collectPendingMarkers(value: unknown, markers: Set<string>): void {
    if (!value || typeof value !== 'object') return

    const node = value as { readonly content?: unknown; readonly text?: unknown }
    if (typeof node.text === 'string') {
      for (const match of node.text.matchAll(
        FindDocumentPendingMarkersUseCase.PENDING_MARKER_PATTERN,
      )) {
        markers.add(match[0])
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) this.collectPendingMarkers(child, markers)
    }
  }
}
