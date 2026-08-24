import { useLocation } from '@tanstack/react-router'

export type ConsultationPageTab = 'details' | 'form' | 'package'

export function useConsultationPage() {
  const { pathname } = useLocation()
  const activeTab: ConsultationPageTab = pathname.includes('/documentos')
    ? 'package'
    : pathname.endsWith('/ficha-atendimento')
      ? 'form'
      : 'details'

  return {
    activeTab,
  }
}
