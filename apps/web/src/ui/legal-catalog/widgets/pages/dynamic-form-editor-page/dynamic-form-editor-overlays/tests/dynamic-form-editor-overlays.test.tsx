import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DynamicFormEditorOverlays } from '../index'
import { useDynamicFormEditorOverlays } from '../use-dynamic-form-editor-overlays'

vi.mock('../use-dynamic-form-editor-overlays', () => ({
  useDynamicFormEditorOverlays: vi.fn(),
}))

vi.mock('../../dynamic-form-delete-dialog', () => ({
  DynamicFormDeleteDialog: () => <div data-testid='delete-dialog' />,
}))
vi.mock('../../dynamic-form-field-dialog', () => ({
  DynamicFormFieldDialog: () => <div data-testid='field-dialog' />,
}))
vi.mock('../../dynamic-form-field-removal-dialog', () => ({
  DynamicFormFieldRemovalDialog: () => <div data-testid='removal-dialog' />,
}))
vi.mock('../../dynamic-form-stale-version-dialog', () => ({
  DynamicFormStaleVersionDialog: () => <div data-testid='stale-dialog' />,
}))
vi.mock('../../dynamic-form-unsaved-changes-dialog', () => ({
  DynamicFormUnsavedChangesDialog: () => <div data-testid='unsaved-dialog' />,
}))

describe('dynamic-form-editor-overlays', () => {
  it('renders every dialog slot from the hook state', () => {
    vi.mocked(useDynamicFormEditorOverlays).mockReturnValue({
      editor: {
        props: { mode: 'create' },
        areaName: '',
        topicNames: [],
        version: 1,
        detailQuery: { isFetching: false },
        saveError: null,
        isDirty: false,
        deletePending: false,
        deleteError: null,
        saveField: vi.fn(),
        removeField: vi.fn(),
        closeOverlay: vi.fn(),
        reloadServerVersion: vi.fn(),
      } as never,
      draft: { stage: 'consultation' } as never,
      overlay: { kind: 'closed' },
      fieldDialog: null,
      editingField: undefined,
      removingField: null,
      form: null,
      closeOnDismiss: vi.fn(),
      discardChanges: vi.fn(),
      deleteForm: vi.fn(),
    })

    render(<DynamicFormEditorOverlays editor={{} as never} />)

    expect(screen.getByTestId('field-dialog')).toBeTruthy()
    expect(screen.getByTestId('removal-dialog')).toBeTruthy()
    expect(screen.getByTestId('unsaved-dialog')).toBeTruthy()
    expect(screen.getByTestId('stale-dialog')).toBeTruthy()
    expect(screen.getByTestId('delete-dialog')).toBeTruthy()
  })
})
