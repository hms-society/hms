import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  useChangeDynamicFormAvailabilityAction,
  useCreateDynamicFormAction,
  useDeleteDynamicFormAction,
  useDynamicFormForAdministrationQuery,
  useLegalAreasForAdministrationQuery,
  useLegalTopicsForAdministrationQuery,
  useUpdateDynamicFormAction,
} from '@/ui/legal-catalog/hooks'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useDynamicFormEditorPage } from '../use-dynamic-form-editor-page'

vi.mock('@/ui/legal-catalog/hooks', () => ({
  useChangeDynamicFormAvailabilityAction: vi.fn(),
  useCreateDynamicFormAction: vi.fn(),
  useDeleteDynamicFormAction: vi.fn(),
  useDynamicFormForAdministrationQuery: vi.fn(),
  useLegalAreasForAdministrationQuery: vi.fn(),
  useLegalTopicsForAdministrationQuery: vi.fn(),
  useUpdateDynamicFormAction: vi.fn(),
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))

const useChangeAvailabilityMock = vi.mocked(useChangeDynamicFormAvailabilityAction)
const useCreateMock = vi.mocked(useCreateDynamicFormAction)
const useDeleteMock = vi.mocked(useDeleteDynamicFormAction)
const useDetailQueryMock = vi.mocked(useDynamicFormForAdministrationQuery)
const useAreasQueryMock = vi.mocked(useLegalAreasForAdministrationQuery)
const useTopicsQueryMock = vi.mocked(useLegalTopicsForAdministrationQuery)
const useUpdateMock = vi.mocked(useUpdateDynamicFormAction)
const useNavigationMock = vi.mocked(useNavigation)

describe('use-dynamic-form-editor-page', () => {
  it('enables saving when adding the first valid field updates a dirty draft', async () => {
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
    } as never)
    useDetailQueryMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
    } as never)
    useAreasQueryMock.mockReturnValue({
      data: [{ id: 'area-1', name: 'Cível', active: true }],
      isPending: false,
      isError: false,
      isFetching: false,
    } as never)
    useTopicsQueryMock.mockReturnValue({
      data: [{ id: 'topic-1', name: 'Contratos', active: true }],
      isPending: false,
      isError: false,
      isFetching: false,
    } as never)
    useCreateMock.mockReturnValue({
      createDynamicForm: vi.fn(),
      isPending: false,
      error: null,
    } as never)
    useUpdateMock.mockReturnValue({
      updateDynamicForm: vi.fn(),
      isPending: false,
      error: null,
    } as never)
    useDeleteMock.mockReturnValue({
      deleteDynamicForm: vi.fn(),
      isPending: false,
      error: null,
    } as never)
    useChangeAvailabilityMock.mockReturnValue({
      changeDynamicFormAvailability: vi.fn(),
      isPending: false,
      error: null,
    } as never)

    const { result } = renderHook(() => useDynamicFormEditorPage({ mode: 'create' }))

    act(() => {
      result.current.updateDraft('name', 'Ficha de contratos')
      result.current.updateDraft('legalAreaId', 'area-1')
      result.current.updateDraft('legalTopicIds', ['topic-1'])
    })

    await waitFor(() => {
      expect(result.current.saveState).toEqual({ kind: 'dirty', isValid: false })
    })

    act(() => {
      result.current.saveField({
        clientId: 'field-1',
        label: 'Nome do contrato',
        type: 'short_text',
        required: true,
      })
    })

    await waitFor(() => {
      expect(result.current.saveState).toEqual({ kind: 'dirty', isValid: true })
    })
  })

  it('reuses an operation key only for an exact retry', async () => {
    const createDynamicForm = vi
      .fn()
      .mockRejectedValueOnce(new Error('Falha temporária'))
      .mockRejectedValueOnce(new Error('Falha temporária'))
      .mockResolvedValue({ id: 'form-1', version: 1 })
    useCreateMock.mockReturnValue({
      createDynamicForm,
      isPending: false,
      error: null,
    } as never)
    useNavigationMock.mockReturnValue({
      navigateTo: vi.fn().mockResolvedValue(undefined),
    } as never)

    const { result } = renderHook(() => useDynamicFormEditorPage({ mode: 'create' }))
    act(() => {
      result.current.updateDraft('name', 'Ficha')
      result.current.updateDraft('legalAreaId', 'area-1')
      result.current.updateDraft('legalTopicIds', ['topic-1'])
      result.current.saveField({
        clientId: 'field-1',
        label: 'Nome',
        type: 'short_text',
        required: true,
      })
    })

    await act(async () => {
      await result.current.submit()
    })
    await waitFor(() =>
      expect(result.current.saveState).toMatchObject({
        kind: 'failure',
        message: 'Não foi possível salvar as alterações.',
      }),
    )
    const firstKey = createDynamicForm.mock.calls[0]?.[0].operationKey

    await act(async () => {
      await result.current.retrySave()
    })
    const retryKey = createDynamicForm.mock.calls[1]?.[0].operationKey
    expect(retryKey).toBe(firstKey)

    act(() => result.current.updateDraft('description', 'Alterada após falha'))
    await act(async () => {
      await result.current.retrySave()
    })
    const editedKey = createDynamicForm.mock.calls[2]?.[0].operationKey
    expect(editedKey).not.toBe(firstKey)
  })
})
