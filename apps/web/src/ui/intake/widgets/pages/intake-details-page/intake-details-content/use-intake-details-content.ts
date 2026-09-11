import type { Client } from '@hms/core/identity/domain/entities'

import type { IntakeDetailsData } from '@/ui/intake/hooks/use-intake-details-query'

export type IntakeDetailsContentPresentation = {
  clientName: string
  isTerminal: boolean
  responsibleName: string
}

export function useIntakeDetailsContent(
  data: IntakeDetailsData,
  responsibleName: string,
): IntakeDetailsContentPresentation {
  const client = data.client?.client as Client | undefined

  return {
    clientName: client
      ? client.type === 'natural'
        ? client.name
        : (client.tradeName ?? client.legalName)
      : 'Cliente não identificado',
    isTerminal:
      data.intake.status === 'contracted' ||
      data.intake.status === 'closed_without_contract',
    responsibleName,
  }
}
