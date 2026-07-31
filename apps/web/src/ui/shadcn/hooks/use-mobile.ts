import * as React from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(function subscribeToViewportChanges() {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    function handleViewportChange() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', handleViewportChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return function unsubscribeFromViewportChanges() {
      mql.removeEventListener('change', handleViewportChange)
    }
  }, [])

  return !!isMobile
}
