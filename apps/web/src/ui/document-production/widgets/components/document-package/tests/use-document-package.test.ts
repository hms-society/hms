import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useDocumentPackage } from '../use-document-package'

function createDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'document-1',
    title: 'Procuração',
    versions: [],
    ...overrides,
  }
}

describe('useDocumentPackage', () => {
  it('maps the latest version and preserves current-version state', () => {
    const { result } = renderHook(() =>
      useDocumentPackage({
        documents: [
          createDocument({
            currentVersionId: 'version-1',
            versions: [
              { id: 'version-1', versionNumber: 1, status: 'approved' },
              { id: 'version-2', versionNumber: 2, status: 'in_review' },
            ],
          }),
        ],
      }),
    )

    expect(result.current[0]).toMatchObject({
      latestVersion: { id: 'version-2' },
      status: 'in_review',
      isCurrent: false,
    })
  })

  it('keeps individual generation states distinct from persisted versions', () => {
    const { result } = renderHook(() =>
      useDocumentPackage({
        documents: [
          createDocument({
            id: 'pending',
            versions: [{ id: 'version-1', versionNumber: 1, status: 'approved' }],
          }),
          createDocument({ id: 'failed', generationStatus: 'failed' }),
          createDocument({ id: 'timed-out', generationStatus: 'running' }),
        ],
        pendingDocumentIds: new Set(['pending']),
        timedOutDocumentIds: new Set(['timed-out']),
      }),
    )

    expect(result.current.map((item) => item.status)).toEqual([
      'generating',
      'failed',
      'not_generated',
    ])
    expect(result.current[2]?.isTimedOut).toBe(true)
  })
})
