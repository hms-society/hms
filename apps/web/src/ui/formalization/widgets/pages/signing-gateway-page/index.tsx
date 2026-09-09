import { InvitationAccessStep } from './invitation-access-step'
import { ChannelSelectionStep } from './channel-selection-step'
import { OtpVerificationStep } from './otp-verification-step'
import { CollaboratorLoginStep } from './collaborator-login-step'
import { DocumentReadingStep } from './document-reading-step'
import { ProviderSigningStep } from './provider-signing-step'
import { SignatureSubmittedStep } from './signature-submitted-step'
import { SignatureConfirmedStep } from './signature-confirmed-step'
import { SigningUnavailableStep } from './signing-unavailable-step'
import { useSigningGatewayPage } from './use-signing-gateway-page'

export const SigningGatewayPage = () => {
  const state = useSigningGatewayPage()
  if (state.step === 'exchanging')
    return (
      <main
        className='flex min-h-screen items-center justify-center bg-background p-6 text-foreground'
        aria-live='polite'
      >
        Carregando assinatura…
      </main>
    )
  if (state.step === 'invitation') return <InvitationAccessStep {...state.props} />
  if (state.step === 'choose_channel') return <ChannelSelectionStep {...state.props} />
  if (state.step === 'enter_otp') return <OtpVerificationStep {...state.props} />
  if (state.step === 'collaborator_login')
    return <CollaboratorLoginStep {...state.props} />
  if (state.step === 'reading') return <DocumentReadingStep {...state.props} />
  if (state.step === 'provider') return <ProviderSigningStep {...state.props} />
  if (state.step === 'submitted') return <SignatureSubmittedStep {...state.props} />
  if (state.step === 'confirmed') return <SignatureConfirmedStep {...state.props} />
  return <SigningUnavailableStep {...state.props} />
}
