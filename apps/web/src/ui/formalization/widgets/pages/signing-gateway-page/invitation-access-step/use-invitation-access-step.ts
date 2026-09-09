export type InvitationAccessStepProps = { isPending: boolean; onContinue: () => void }

export function useInvitationAccessStep(props: InvitationAccessStepProps) {
  function handleContinue() {
    props.onContinue()
  }
  return { handleContinue, isPending: props.isPending }
}
