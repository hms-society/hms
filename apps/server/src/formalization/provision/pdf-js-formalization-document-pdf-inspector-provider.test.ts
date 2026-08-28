import { describe, expect, it } from 'vitest'

import { FormalizationDocumentPdfInspectionError } from '@hms/core/formalization/domain/errors'

import { PdfJsFormalizationDocumentPdfInspectorProvider } from './pdf-js-formalization-document-pdf-inspector-provider'

describe('PdfJsFormalizationDocumentPdfInspectorProvider', () => {
  it('returns authoritative one-based geometry for every page', async () => {
    const provider = new PdfJsFormalizationDocumentPdfInspectorProvider()

    await expect(provider.inspect(createPdf(2))).resolves.toEqual({
      pageCount: 2,
      pages: [
        { page: 1, width: 612, height: 792 },
        { page: 2, width: 612, height: 792 },
      ],
    })
  })

  it('maps malformed PDF input to a safe typed failure', async () => {
    const provider = new PdfJsFormalizationDocumentPdfInspectorProvider()

    await expect(
      provider.inspect(new Uint8Array([37, 80, 68, 70])),
    ).rejects.toBeInstanceOf(FormalizationDocumentPdfInspectionError)
  })
})

function createPdf(pageCount: number): Uint8Array {
  const pageIds = Array.from({ length: pageCount }, (_, index) => index + 3)
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`,
    ...pageIds.map(() => '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>'),
  ]
  let content = '%PDF-1.4\n'
  const offsets = [0]

  for (const [index, object] of objects.entries()) {
    offsets.push(new TextEncoder().encode(content).byteLength)
    content += `${index + 1} 0 obj\n${object}\nendobj\n`
  }

  const xrefOffset = new TextEncoder().encode(content).byteLength
  content += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  content += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  content += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return new TextEncoder().encode(content)
}
