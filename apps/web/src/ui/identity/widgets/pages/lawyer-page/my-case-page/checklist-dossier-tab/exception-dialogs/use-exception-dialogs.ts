import type { ChecklistDossierController } from '../types'
export function useExceptionDialogs(controller: ChecklistDossierController) {
  function handleCloseRequest() {
    controller.state.setIsExceptionModalOpen(false)
  }
  function handleJustificationOpenChange(open: boolean) {
    if (!open) controller.closeJustification()
  }
  return { handleCloseRequest, handleJustificationOpenChange }
}
