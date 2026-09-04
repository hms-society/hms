import { useFormalizationDocumentProduction } from '@/ui/formalization/hooks/use-formalization-document-production-action'
import { useFormalizationQuery } from '@/ui/formalization/hooks/use-formalization-query'
import { useFormalizationSignatureConfiguration } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
import { useFormalizationSignatureSending } from '@/ui/formalization/hooks/use-formalization-signature-sending-action'

export function useFormalizationSendingConfigurationPage(formalizationId: string) {
  const query = useFormalizationQuery(formalizationId)
  const formalization = query.data?.formalization
  const documentProduction = useFormalizationDocumentProduction(
    formalizationId,
    formalization?.contractFormState === 'closed',
  )
  const signatureConfiguration = useFormalizationSignatureConfiguration(
    formalizationId,
    documentProduction.isPackageConfirmed,
  )
  const signatureSending = useFormalizationSignatureSending(
    formalizationId,
    documentProduction.isPackageConfirmed,
  )

  return {
    query,
    documentProduction,
    signatureConfiguration,
    signatureSending,
    formalization,
  }
}
