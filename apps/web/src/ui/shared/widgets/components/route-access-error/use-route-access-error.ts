import { useRouter } from '@tanstack/react-router'

export function useRouteAccessError() {
  const router = useRouter()

  function handleRetry() {
    void router.invalidate()
  }

  return { handleRetry }
}
