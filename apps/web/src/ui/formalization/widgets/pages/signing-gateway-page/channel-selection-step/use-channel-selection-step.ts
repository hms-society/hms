import { useState } from 'react'
import type { SignatureGatewayChannelsDto } from '@hms/validation/formalization'

export type ChannelSelectionStepProps = {
  channels: SignatureGatewayChannelsDto
  selectedChannelId?: string
  isPending: boolean
  onSelect: (channelId: string) => void
  onContinue: () => void
}

export function useChannelSelectionStep(props: ChannelSelectionStepProps) {
  const [selectedChannelId, setSelectedChannelId] = useState(props.selectedChannelId)
  function handleSelect(channelId: string) {
    setSelectedChannelId(channelId)
    props.onSelect(channelId)
  }
  function handleContinue() {
    props.onContinue()
  }
  return { handleContinue, handleSelect, isPending: props.isPending, selectedChannelId }
}
