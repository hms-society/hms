import { Inject, Injectable } from '@nestjs/common'
import type { DocumentPdfConverter } from '@hms/core/document-production/interfaces'
import { DocumentPdfConversionError } from '@hms/core/document-production/domain/errors'
import { EnvProvider } from '@/shared/provision/env/env-provider'

@Injectable()
export class GotenbergDocumentPdfConverterProvider implements DocumentPdfConverter {
  constructor(@Inject(EnvProvider) private readonly envProvider: EnvProvider) {}

  async convert(input: Parameters<DocumentPdfConverter['convert']>[0]) {
    if (input.content.byteLength > this.envProvider.get('GOTENBERG_MAX_INPUT_BYTES')) {
      throw new DocumentPdfConversionError(
        'O documento excede o limite de conversão configurado.',
        false,
      )
    }
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      this.envProvider.get('GOTENBERG_TIMEOUT_MS'),
    )
    const form = new FormData()
    form.append(
      'files',
      new Blob([new Uint8Array(input.content).buffer as ArrayBuffer], {
        type: input.contentType,
      }),
      input.fileName,
    )
    try {
      const response = await fetch(
        `${this.envProvider.get('GOTENBERG_URL').replace(/\/$/, '')}/forms/libreoffice/convert`,
        { method: 'POST', body: form, signal: controller.signal },
      )
      if (!response.ok)
        throw new DocumentPdfConversionError(
          response.status >= 500
            ? 'O conversor de PDF está temporariamente indisponível.'
            : 'O conversor recusou o documento.',
          response.status >= 500,
        )
      const contentType = response.headers.get('content-type')?.split(';', 1)[0]
      const content = new Uint8Array(await response.arrayBuffer())
      if (
        contentType !== 'application/pdf' ||
        content.byteLength < 4 ||
        new TextDecoder().decode(content.slice(0, 4)) !== '%PDF'
      )
        throw new DocumentPdfConversionError(
          'O conversor retornou um conteúdo que não é PDF.',
          false,
        )
      if (content.byteLength > this.envProvider.get('GOTENBERG_MAX_OUTPUT_BYTES'))
        throw new DocumentPdfConversionError(
          'O PDF convertido excede o limite configurado.',
          false,
        )
      return {
        contentType: 'application/pdf' as const,
        content,
        converterVersion: 'gotenberg-8.34.0',
      }
    } catch (error) {
      if (error instanceof DocumentPdfConversionError) throw error
      throw new DocumentPdfConversionError(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'A conversão do PDF excedeu o tempo limite.'
          : 'O conversor de PDF está temporariamente indisponível.',
        true,
      )
    } finally {
      clearTimeout(timeout)
    }
  }
}
