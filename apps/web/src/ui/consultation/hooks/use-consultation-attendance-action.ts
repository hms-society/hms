import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FinalizeConsultationAttendanceDto } from '@hms/validation/consultation'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export const useConsultationAttendanceActions = (consultationId?: string) => {
  const { consultationService } = useRestContext()
  const queryClient = useQueryClient()

  const finalizeAttendanceMutation = useMutation({
    mutationFn: async function finalizeAttendance(
      request: FinalizeConsultationAttendanceDto,
    ) {
      if (!consultationId) throw new Error('ID da consulta não fornecido.')

      const response = await consultationService.finalizeAttendance(
        consultationId,
        request,
      )
      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async function invalidateFinalizedAttendance() {
      await queryClient.invalidateQueries({
        queryKey: ['consultation', consultationId],
      })
    },
  })

  const editAttendanceMutation = useMutation({
    mutationFn: async function editAttendance() {
      if (!consultationId) throw new Error('ID da consulta não fornecido.')

      const response = await consultationService.editAttendance(consultationId)
      if (response.isFailure) response.throwError()

      return response.body
    },
    onSuccess: async function invalidateEditedAttendance() {
      await queryClient.invalidateQueries({
        queryKey: ['consultation', consultationId],
      })
    },
  })

  return {
    finalizeAttendance: finalizeAttendanceMutation.mutateAsync,
    isFinalizingAttendance: finalizeAttendanceMutation.isPending,
    editAttendance: editAttendanceMutation.mutateAsync,
    isEditingAttendance: editAttendanceMutation.isPending,
    editAttendanceError: editAttendanceMutation.error,
  }
}
