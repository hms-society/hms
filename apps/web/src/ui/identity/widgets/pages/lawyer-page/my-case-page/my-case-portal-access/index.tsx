import { PortalAccessDialog } from '../portal-access-dialog'
import type { useMyCasePage } from '../use-my-case-page'

export type MyCasePortalAccessProps = {
  state: ReturnType<typeof useMyCasePage>
  isPickerOpen: boolean
  setIsPickerOpen: (open: boolean) => void
}

export const MyCasePortalAccess = ({
  state,
  isPickerOpen,
  setIsPickerOpen,
}: MyCasePortalAccessProps) => (
  <PortalAccessDialog
    expiresAt={state.portalAccessExpiresAt}
    canViewCaseStatus={state.canViewCaseStatus}
    canViewIntakeStatus={state.canViewIntakeStatus}
    canUpload={state.canUpload}
    isGenerating={state.isGeneratingPortalLink}
    onGenerate={state.handleGeneratePortalLink}
    onCopy={state.handleCopyPortalLink}
    onOpenChange={(open) => {
      setIsPickerOpen(open)
      if (!open) {
        state.handleClosePortalAccessDialog()
        state.setSelectedThirdPartyId('')
      }
    }}
    open={Boolean(state.portalAccessUrl) || isPickerOpen}
    selectedThirdPartyId={state.selectedThirdPartyId}
    onCanViewCaseStatusChange={state.setCanViewCaseStatus}
    onCanViewIntakeStatusChange={state.setCanViewIntakeStatus}
    onCanUploadChange={state.setCanUpload}
    onThirdPartyChange={state.setSelectedThirdPartyId}
    thirdParties={state.thirdParties}
    url={state.portalAccessUrl}
  />
)
