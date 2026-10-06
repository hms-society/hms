import { describe, expect, it } from 'vitest'
import { DocumentVersionFaker } from '@hms/core/document-production/domain/entities/fakers'

import { selectDocumentFileVersion } from '@/document-production/rest/controllers/select-document-file-version'

describe('selectDocumentFileVersion', () => {
  it('selects the requested version instead of the latest version', () => {
    const requestedVersion = DocumentVersionFaker.fake({
      id: 'version-1',
      versionNumber: 1,
    })
    const latestVersion = DocumentVersionFaker.fake({
      id: 'version-2',
      versionNumber: 2,
    })

    expect(
      selectDocumentFileVersion([requestedVersion, latestVersion], 'version-1'),
    ).toBe(requestedVersion)
  })
})
