import { useExceptionDialogs } from './use-exception-dialogs'
import type { ChecklistDossierController } from '../types'
import { RequestDocumentExceptionModal } from '@/ui/document-engine/widgets/pages/document-analysis-page/request-document-exception-modal'
import { RejectDocumentExceptionModal } from '@/ui/document-engine/widgets/pages/document-analysis-page/reject-document-exception-modal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'

export type ExceptionDialogsProps = {
  controller: ChecklistDossierController
  readOnly: boolean
}

export const ExceptionDialogs = ({ controller, readOnly }: ExceptionDialogsProps) => {
  const { handleCloseRequest, handleJustificationOpenChange } =
    useExceptionDialogs(controller)
  return (
    <>
      {!readOnly && (
        <RequestDocumentExceptionModal
          isOpen={controller.state.isExceptionModalOpen}
          onClose={handleCloseRequest}
          isLoading={controller.state.isRequestingException}
          onSubmit={controller.state.requestException}
          checklistItems={controller.state.checklistItems}
        />
      )}
      {!readOnly && (
        <RejectDocumentExceptionModal
          isOpen={controller.isRejectModalOpen && Boolean(controller.exceptionToReject)}
          onClose={controller.closeRejectModal}
          isLoading={controller.isRejectingException}
          onSubmit={controller.handleConfirmReject}
        />
      )}
      <Dialog
        open={Boolean(controller.justificationToView)}
        onOpenChange={handleJustificationOpenChange}
      >
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Motivo da Recusa</DialogTitle>
            <DialogDescription className='mt-2 whitespace-pre-wrap text-[14px] text-foreground'>
              {controller.justificationToView}
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4 flex justify-end'>
            <Button
              variant='outline'
              className='rounded-full'
              onClick={controller.closeJustification}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
