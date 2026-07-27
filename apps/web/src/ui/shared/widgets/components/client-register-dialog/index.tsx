import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'

import { ClientIdentificationStep } from './client-identification-step'
import { ClientPrivacyStep } from './client-privacy-step'
import { ClientRegisterDialogStepper } from './client-register-dialog-stepper'
import { ClientRegistrationStep } from './client-registration-step'
import { ClientReviewStep } from './client-review-step'
import { ClientSearchResultStep } from './client-search-result-step'
import {
  useClientRegisterDialog,
  type ClientRegisterDialogProps,
} from './use-client-register-dialog'

export type { ClientRegisterDialogProps } from './use-client-register-dialog'

export const ClientRegisterDialog = (props: ClientRegisterDialogProps) => {
  const controller = useClientRegisterDialog(props)

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        ref={controller.dialogContentRef}
        className='flex max-h-[min(90vh,48rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 font-sans'
        aria-describedby='client-register-dialog-description'
      >
        <DialogHeader className='shrink-0 border-b px-6 py-5 pr-12'>
          <DialogTitle className='font-serif text-2xl'>
            Identificar ou cadastrar cliente
          </DialogTitle>
          <DialogDescription id='client-register-dialog-description'>
            Consulte um cadastro existente ou registre um novo Client com os dados
            necessários.
          </DialogDescription>
          <ClientRegisterDialogStepper state={controller.state} />
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto px-6 py-6'>
          {controller.state === 'identification' && (
            <ClientIdentificationStep controller={controller} />
          )}
          {(controller.state === 'existing-client' || controller.state === 'not-found') &&
            controller.searchResult && (
              <ClientSearchResultStep
                controller={controller}
                result={controller.searchResult}
              />
            )}
          {controller.state === 'registration' && (
            <ClientRegistrationStep controller={controller} />
          )}
          {controller.state === 'privacy' && (
            <ClientPrivacyStep controller={controller} />
          )}
          {controller.state === 'review' && <ClientReviewStep controller={controller} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
