import { Link, useNavigate } from '@tanstack/react-router'
import { useClientRegisterDialog } from '@/ui/shared/widgets/components/client-register-dialog/use-client-register-dialog'
import { ClientIdentificationStep } from '@/ui/shared/widgets/components/client-register-dialog/client-identification-step'
import { ClientSearchResultStep } from '@/ui/shared/widgets/components/client-register-dialog/client-search-result-step'
import { ClientRegistrationStep } from '@/ui/shared/widgets/components/client-register-dialog/client-registration-step'
import { ClientPrivacyStep } from '@/ui/shared/widgets/components/client-register-dialog/client-privacy-step'
import { ClientReviewStep } from '@/ui/shared/widgets/components/client-register-dialog/client-review-step'
import { ClientRegisterDialogStepper } from '@/ui/shared/widgets/components/client-register-dialog/client-register-dialog-stepper'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { ClientDetails } from '@hms/core/identity/domain/entities'

export const NewClientPage = () => {
  const navigate = useNavigate()

  const controller = useClientRegisterDialog({
    open: true,
    onOpenChange: (open) => {
      if (!open) {
        navigate({ to: '/clientes' })
      }
    },
    onClientSelected: (clientDetails: ClientDetails) => {
      navigate({
        to: '/clientes/$clienteId',
        params: { clienteId: clientDetails.client.id },
      })
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pt-10 pb-12 px-4 sm:px-6">
      <Link
        to="/clientes"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary outline-none hover:text-brand focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Icon name="arrow-left" className="size-4" />
        Clientes
      </Link>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-serif font-semibold text-foreground sm:text-3xl">
          Identificar ou cadastrar cliente
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulte um cadastro existente ou registre um novo cliente com os dados necessários.
        </p>
      </div>

      <div className="mt-2">
        <ClientRegisterDialogStepper state={controller.state} />
      </div>

      <div
        ref={controller.dialogContentRef}
        className="mt-4 overflow-hidden rounded-2xl border border-border bg-card px-6 py-6 shadow-sm sm:px-8 sm:py-7"
      >
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
        {controller.state === 'review' && (
          <ClientReviewStep controller={controller} />
        )}
      </div>
    </div>
  )
}