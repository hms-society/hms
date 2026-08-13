import { useState } from 'react'
import type { AiSuggestion } from '@hms/core/shared/domain/structures'

export type AiSuggestionCardProps = {
  suggestion: AiSuggestion
  onAccept?: (suggestionId: string) => Promise<void> | void
  onAdjust?: (suggestionId: string, adjustedContent: string) => Promise<void> | void
  onReject?: (suggestionId: string, rejectionReason: string) => Promise<void> | void
  onBlock?: (suggestionId: string) => Promise<void> | void
}

export function useAiSuggestionCard(props: AiSuggestionCardProps) {
  const { suggestion, onAccept, onAdjust, onReject, onBlock } = props

  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustedText, setAdjustedText] = useState(
    suggestion.adjustedContent ?? suggestion.content,
  )

  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReasonText, setRejectionReasonText] = useState(
    suggestion.rejectionReason ?? '',
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  const isLowConfidence = suggestion.confidence === 'low'
  const isHighConfidence = suggestion.confidence === 'high' || !suggestion.confidence

  async function handleConfirmAccept() {
    if (!onAccept) return
    setIsSubmitting(true)
    try {
      await onAccept(suggestion.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartAdjust() {
    setIsAdjusting(true)
    setIsRejecting(false)
  }

  function handleCancelAdjust() {
    setIsAdjusting(false)
    setAdjustedText(suggestion.adjustedContent ?? suggestion.content)
  }

  async function handleConfirmAdjust() {
    if (!onAdjust || !adjustedText.trim()) return
    setIsSubmitting(true)
    try {
      await onAdjust(suggestion.id, adjustedText.trim())
      setIsAdjusting(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleStartReject() {
    setIsRejecting(true)
    setIsAdjusting(false)
  }

  function handleCancelReject() {
    setIsRejecting(false)
    setRejectionReasonText(suggestion.rejectionReason ?? '')
  }

  async function handleConfirmReject() {
    if (!onReject || !rejectionReasonText.trim()) return
    setIsSubmitting(true)
    try {
      await onReject(suggestion.id, rejectionReasonText.trim())
      setIsRejecting(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmBlock() {
    if (!onBlock) return
    setIsSubmitting(true)
    try {
      await onBlock(suggestion.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    suggestion,
    isLowConfidence,
    isHighConfidence,
    isAdjusting,
    adjustedText,
    setAdjustedText,
    isRejecting,
    rejectionReasonText,
    setRejectionReasonText,
    isSubmitting,
    handleConfirmAccept,
    handleStartAdjust,
    handleCancelAdjust,
    handleConfirmAdjust,
    handleStartReject,
    handleCancelReject,
    handleConfirmReject,
    handleConfirmBlock,
  }
}
