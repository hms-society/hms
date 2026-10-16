import type { DocumentPdfConverter } from '@hms/core/document-production/interfaces'
import { DocumentPdfConversionError } from '@hms/core/document-production/domain/errors'
import { Injectable } from '@nestjs/common'

import { EnvProvider } from '@/shared/provision/env/env-provider'

const PDF_CONTENT_TYPE = 'application/pdf' as const

@Injectable()
export class GotenbergDocumentPdfConverter implements DocumentPdfConverter {
  constructor(private readonly env: EnvProvider) {}

  async convert(input: {
    readonly fileName: string
    readonly contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    readonly content: Uint8Array
    readonly traceId: string
  }) {
    const form = new FormData()
    form.append(
      'files',
      new Blob([input.content as BlobPart], { type: input.contentType }),
      input.fileName,
    )

    const baseUrl = this.env.get('DOCUMENT_PDF_CONVERTER_URL').replace(/\/$/, '')
    let response: Response
    try {
      response = await fetch(`${baseUrl}/forms/libreoffice/convert`, {
        method: 'POST',
        body: form,
        headers: { 'X-HMS-Trace-Id': input.traceId },
        signal: AbortSignal.timeout(60_000),
      })
    } catch (error) {
      throw new DocumentPdfConversionError(
        error instanceof Error
          ? `Não foi possível acessar o conversor PDF: ${error.message}`
          : 'Não foi possível acessar o conversor PDF.',
      )
    }

    if (!response.ok) {
      const details = (await response.text()).trim().slice(0, 240)
      throw new DocumentPdfConversionError(
        `O conversor PDF retornou HTTP ${response.status}${details ? `: ${details}` : '.'}`,
      )
    }

    const content = new Uint8Array(await response.arrayBuffer())
    if (
      content.byteLength < 5 ||
      String.fromCharCode(...content.slice(0, 5)) !== '%PDF-'
    ) {
      throw new DocumentPdfConversionError(
        'O conversor PDF retornou um arquivo inválido.',
      )
    }

    return {
      contentType: PDF_CONTENT_TYPE,
      content,
      converterVersion:
        response.headers.get('Gotenberg-Version') ??
        response.headers.get('X-Gotenberg-Version') ??
        'gotenberg',
    }
  }
}
