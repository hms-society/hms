import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useQueryStates } from 'nuqs'
import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import {
  useChangeDynamicFormAvailabilityAction,
  useDeleteDynamicFormAction,
  useDuplicateDynamicFormAction,
  useDynamicFormsAdministrationQuery,
} from '@/ui/legal-catalog/hooks'
import { useDynamicFormsPage } from '../use-dynamic-forms-page'

vi.mock('nuqs', () => ({
  parseAsInteger: { withDefault: (value: number) => ({ defaultValue: value }) },
  parseAsString: { withDefault: (value: string) => ({ defaultValue: value }) },
  useQueryStates: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))
vi.mock('@/ui/legal-catalog/hooks', () => ({
  useChangeDynamicFormAvailabilityAction: vi.fn(),
  useDeleteDynamicFormAction: vi.fn(),
  useDuplicateDynamicFormAction: vi.fn(),
  useDynamicFormsAdministrationQuery: vi.fn(),
}))

const useQueryStatesMock = vi.mocked(useQueryStates)
const useNavigationMock = vi.mocked(useNavigation)
const useChangeDynamicFormAvailabilityActionMock = vi.mocked(
  useChangeDynamicFormAvailabilityAction,
)
const useDeleteDynamicFormActionMock = vi.mocked(useDeleteDynamicFormAction)
const useDuplicateDynamicFormActionMock = vi.mocked(useDuplicateDynamicFormAction)
const useDynamicFormsAdministrationQueryMock = vi.mocked(
  useDynamicFormsAdministrationQuery,
)

describe('useDynamicFormsPage', () => {
  it('keeps an overlay tied to the selected row and navigates editor actions', () => {
    const setSearchParams = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    useQueryStatesMock.mockReturnValue([
      { search: '', stage: '', status: '', page: 1, pageSize: 5 },
      setSearchParams,
    ] as never)
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
    useDynamicFormsAdministrationQueryMock.mockReturnValue({
      data: { items: [], page: 1, pageSize: 5, total: 0, pageCount: 0 },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never)
    useDuplicateDynamicFormActionMock.mockReturnValue({
      duplicateDynamicForm: vi.fn(),
      conflict: null,
      isPending: false,
      error: null,
    })
    useChangeDynamicFormAvailabilityActionMock.mockReturnValue({
      changeDynamicFormAvailability: vi.fn(),
      isPending: false,
      error: null,
    })
    useDeleteDynamicFormActionMock.mockReturnValue({
      deleteDynamicForm: vi.fn(),
      isPending: false,
      error: null,
    })

    const { result } = renderHook(() => useDynamicFormsPage())
    act(() => result.current.handleEdit('form-1'))
    expect(navigateTo).toHaveBeenCalledWith('dynamicForm', {
      params: { dynamicFormId: 'form-1' },
    })
    expect(result.current.overlay.kind).toBe('closed')
  })

  it('completes availability and deletion mutations for the selected form', async () => {
    const setSearchParams = vi.fn().mockResolvedValue(undefined)
    const navigateTo = vi.fn().mockResolvedValue(undefined)
    const changeDynamicFormAvailability = vi.fn().mockResolvedValue(undefined)
    const deleteDynamicForm = vi.fn().mockResolvedValue(undefined)
    const form: DynamicFormListItem = {
      id: 'form-1',
      name: 'Ficha',
      description: null,
      status: 'available',
      stage: 'consultation',
      legalArea: { id: 'area-1', name: 'Cível' },
      legalTopics: [],
      fieldCount: 1,
    }
    useQueryStatesMock.mockReturnValue([
      { search: '', stage: '', status: '', page: 1, pageSize: 5 },
      setSearchParams,
    ] as never)
    useNavigationMock.mockReturnValue({
      navigateTo,
      navigateCollaboratorsSearch: vi.fn(),
    })
    useDynamicFormsAdministrationQueryMock.mockReturnValue({
      data: { items: [form], page: 1, pageSize: 5, total: 1, pageCount: 1 },
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    } as never)
    useDuplicateDynamicFormActionMock.mockReturnValue({
      duplicateDynamicForm: vi.fn(),
      conflict: null,
      isPending: false,
      error: null,
    })
    useChangeDynamicFormAvailabilityActionMock.mockReturnValue({
      changeDynamicFormAvailability,
      isPending: false,
      error: null,
    })
    useDeleteDynamicFormActionMock.mockReturnValue({
      deleteDynamicForm,
      isPending: false,
      error: null,
    })

    const { result } = renderHook(() => useDynamicFormsPage())
    act(() => result.current.openAvailability(form))
    await act(async () => result.current.handleAvailability())
    expect(changeDynamicFormAvailability).toHaveBeenCalledWith('form-1', {
      status: 'unavailable',
    })
    expect(result.current.overlay.kind).toBe('closed')

    act(() => result.current.openDelete(form))
    await act(async () => result.current.handleDelete())
    expect(deleteDynamicForm).toHaveBeenCalledWith('form-1')
    expect(result.current.overlay.kind).toBe('closed')
  })
})
