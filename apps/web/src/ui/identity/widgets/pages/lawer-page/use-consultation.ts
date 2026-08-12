import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useSchedule } from './use-scheduling'

export function useConsultation() {
  const { user } = useAuthContext()
  const { schedulingService } = useRestContext()
  const queryClient = useQueryClient()

  const { schedule, isLoading, isError, error } = useSchedule()
  const [duration, setDuration] = useState<'30min' | '45min' | '1h'>('45min')
  const updateDurationMutation = useMutation({
    mutationFn: async (minutes: number) => {
      if (!schedule?.id) throw new Error('Agenda não encontrada')

      const response = await schedulingService.updateDuration(schedule.id, minutes)

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id] })
    },
  })
  const getOrCreateScheduleId = async () => {
    if (!user) throw new Error('Usuário não autenticado')

    let scheduleId =
      schedule?.id || (schedule as any)?._id || (schedule as any)?.schedule?.id

    if (!scheduleId) {
      const createResponse = await schedulingService.createSchedule({
        collaboratorId: user.id,
        defaultDurationMinutes: 45,
        weeklyAvailability: [],
      })

      if (createResponse.isFailure) {
        createResponse.throwError()
      }

      scheduleId = createResponse.body?.id || createResponse.body?.schedule?.id
    }

    if (!scheduleId) {
      throw new Error('Não foi possível obter ou criar uma agenda para o colaborador')
    }

    return scheduleId
  }

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
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id] })
    },
  })

  const addBlockMutation = useMutation({
    mutationFn: async (payload: {
      startDate: string
      endDate: string
      reason?: string
    }) => {
      const scheduleId = await getOrCreateScheduleId()

      const response = await schedulingService.addBlock({
        scheduleId,
        startsOn: payload.startDate,
        endsOn: payload.endDate,
        reason: payload.reason,
      })

      if (response.isFailure) {
        response.throwError()
      }

      return response.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id] })
    },
  })

  const removeBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const response = await schedulingService.removeBlock(blockId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', user?.id] })
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
