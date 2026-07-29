import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'

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
        showCloseButton={false}
        className='flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden p-0 font-sans sm:max-h-[min(90dvh,48rem)] sm:max-w-3xl'
        aria-describedby='client-register-dialog-description'
      >
        <DialogClose asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute top-3 right-3 z-10 rounded-full sm:top-4 sm:right-4'
            aria-label='Fechar diálogo'
          >
            <Icon name='x' />
          </Button>
        </DialogClose>
        <DialogHeader className='shrink-0 border-b border-border bg-muted/20 px-5 py-5 pr-16 sm:px-8 sm:py-6 sm:pr-20'>
          <DialogTitle className='text-balance font-serif text-2xl leading-tight'>
            Identificar ou cadastrar cliente
          </DialogTitle>
          <DialogDescription
            id='client-register-dialog-description'
            className='max-w-2xl leading-5'
          >
            Consulte um cadastro existente ou registre um novo cliente com os dados
            necessários.
          </DialogDescription>
          <ClientRegisterDialogStepper state={controller.state} />
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7'>
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
