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
        className='flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-lg sm:max-h-[min(90dvh,48rem)] sm:max-w-3xl'
        aria-describedby='client-register-dialog-description'
      >
        <DialogClose asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='absolute top-4 right-4 z-10 size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground'
            aria-label='Fechar diálogo'
          >
            <Icon name='x' className='size-4' />
          </Button>
        </DialogClose>
        <DialogHeader className='shrink-0 space-y-1.5 border-b border-border bg-muted/30 px-6 py-5 pr-14 sm:px-8 sm:py-6 sm:pr-16'>
          <DialogTitle className='text-balance font-serif text-xl font-semibold text-foreground sm:text-2xl'>
            Identificar ou cadastrar cliente
          </DialogTitle>
          <DialogDescription
            id='client-register-dialog-description'
            className='max-w-2xl text-xs text-muted-foreground leading-relaxed sm:text-sm'
          >
            Consulte um cadastro existente ou registre um novo cliente com os dados
            necessários.
          </DialogDescription>

          <div className='pt-2'>
            <ClientRegisterDialogStepper state={controller.state} />
          </div>
        </DialogHeader>
        <div className='min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-7'>
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
