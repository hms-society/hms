import { ROUTES } from '@/constants/routes'

export type CollaboratorLoginStepProps = {
  loginPath: string
  error?: 'account_mismatch'
  isPending: boolean
  onContinue: () => void
}

export function useCollaboratorLoginStep(props: CollaboratorLoginStepProps) {
  const loginSearch = getLoginSearch(props.loginPath)
  const description =
    props.error === 'account_mismatch'
      ? 'A conta atual não é o colaborador atribuído. Entre com a conta correta para continuar.'
      : 'Entre na HMS para continuar com a assinatura.'

  function handleContinue() {
    props.onContinue()
  }

  return { description, handleContinue, isPending: props.isPending, loginSearch }
}

function getLoginSearch(loginPath: string) {
  const loginUrl = new URL(loginPath, 'http://hms.local')

  if (
    loginUrl.pathname !== ROUTES.login ||
    loginUrl.searchParams.get('returnTo') !== ROUTES.signingGateway
  )
    return undefined

  return { returnTo: ROUTES.signingGateway }
}
