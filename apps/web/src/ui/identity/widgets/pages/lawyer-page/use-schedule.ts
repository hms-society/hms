import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { AppError } from '@hms/core/shared/domain/errors'

import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useSchedule } from './use-scheduling'

export function useConsultation() {
  const { schedulingService } = useRestContext()
  const queryClient = useQueryClient()
  const { currentCollaborator } = useCurrentCollaboratorQuery()
  const collaboratorId = currentCollaborator?.collaboratorId
  const scheduleQueryKey = ['schedule', collaboratorId] as const

  const { schedule, isLoading, isError, error } = useSchedule()
  const [duration, setDuration] = useState<'30min' | '45min' | '1h'>('45min')

  async function getOrCreateScheduleId(): Promise<string> {
    if (!collaboratorId) {
      throw new AppError('Current collaborator is required')
    }

    let scheduleId =
      schedule?.id || (schedule as any)?._id || (schedule as any)?.schedule?.id

    if (!scheduleId) {
      const createResponse = await schedulingService.createSchedule({
        collaboratorId,
        defaultDurationMinutes: 45,
        weeklyAvailability: [],
      })

      if (createResponse.isFailure) {
        createResponse.throwError()
      }

      scheduleId = createResponse.body?.id || createResponse.body?.schedule?.id
    }

    if (!scheduleId) {
      throw new AppError('Unable to obtain or create a schedule for the collaborator')
    }

    return scheduleId
  }

  const updateDurationMutation = useMutation({
    mutationFn: async (minutes: number) => {
      const scheduleId = await getOrCreateScheduleId()

      const response = await schedulingService.updateDuration(scheduleId, minutes)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueryKey })
    },
  })

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (weeklyAvailability: unknown) => {
      const scheduleId = await getOrCreateScheduleId()

      const response = await schedulingService.updateAvailability({
        scheduleId,
        weeklyAvailability,
      })

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueryKey })
    },
  })

  const addBlockMutation = useMutation({
    mutationFn: async (payload: {
      startDate: string
      endDate: string
      reason?: string
    }) => {
      const scheduleId = await getOrCreateScheduleId()
      const startsOn = payload.startDate
      const endsOn = payload.endDate || payload.startDate

      const response = await schedulingService.addBlock({
        scheduleId,
        startsOn,
        endsOn,
        reason: payload.reason,
      })

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueryKey })
    },
  })
  const removeBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      if (!blockId) throw new AppError('Blocked period ID is required')

      const response = await schedulingService.removeBlock(blockId)

      if (response?.isFailure) {
        response.throwError()
      }

      return response?.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleQueryKey })
    },
  })

  return {
    duration,
    setDuration,
    schedule,
    isLoading,
    isError,
    error,
    updateAvailability: updateAvailabilityMutation.mutateAsync,
    isUpdatingAvailability: updateAvailabilityMutation.isPending,
    addBlock: addBlockMutation.mutateAsync,
    isAddingBlock: addBlockMutation.isPending,
    removeBlock: removeBlockMutation.mutateAsync,
    isRemovingBlock: removeBlockMutation.isPending,
    updateDuration: updateDurationMutation.mutateAsync,
    isUpdatingDuration: updateDurationMutation.isPending,
  }
}
