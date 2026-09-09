export type ProviderSigningStepProps = {
  proxyPath: string
  title: string
  onSubmitted: () => void
  onUnavailable: () => void
}

export function useProviderSigningStep(props: ProviderSigningStepProps) {
  function handleSubmitted() {
    props.onSubmitted()
  }
  function handleUnavailable() {
    props.onUnavailable()
  }
  return { handleSubmitted, handleUnavailable }
}
