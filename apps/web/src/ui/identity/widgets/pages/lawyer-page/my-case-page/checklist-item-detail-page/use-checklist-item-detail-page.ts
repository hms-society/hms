import { useNavigation } from '@/ui/shared/hooks/use-navigation'

export type UseChecklistItemDetailPageParams = {
  caseId: string
  checklistItemId: string
}

export function useChecklistItemDetailPage({
  caseId,
}: UseChecklistItemDetailPageParams) {
  const { navigateTo } = useNavigation()

  function handleBackToCase() {
    void navigateTo('lawyerCaseDetails', { params: { caseId } })
  }

  return { handleBackToCase }
}
