import { useState } from 'react'

export function useMyCasePortalState() {
  const [portalAccessUrl, setPortalAccessUrl] = useState<string | null>(null)
  const [portalAccessExpiresAt, setPortalAccessExpiresAt] = useState<string | null>(null)
  const [selectedThirdPartyId, setSelectedThirdPartyId] = useState('')
  const [canViewCaseStatus, setCanViewCaseStatus] = useState(false)
  const [canViewIntakeStatus, setCanViewIntakeStatus] = useState(false)
  const [canUpload, setCanUpload] = useState(false)

  function closePortalAccessDialog() {
    setPortalAccessUrl(null)
    setPortalAccessExpiresAt(null)
    setCanViewCaseStatus(false)
    setCanViewIntakeStatus(false)
    setCanUpload(false)
  }

  return {
    portalAccessUrl,
    portalAccessExpiresAt,
    selectedThirdPartyId,
    canViewCaseStatus,
    canViewIntakeStatus,
    canUpload,
    setPortalAccessUrl,
    setPortalAccessExpiresAt,
    setSelectedThirdPartyId,
    setCanViewCaseStatus,
    setCanViewIntakeStatus,
    setCanUpload,
    closePortalAccessDialog,
  }
}
