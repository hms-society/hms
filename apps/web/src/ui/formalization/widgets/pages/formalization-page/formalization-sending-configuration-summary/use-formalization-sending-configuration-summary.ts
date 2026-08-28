import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'

import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

export type FormalizationSendingConfigurationSummaryProps = {
  formalizationId: string
  isPackageConfirmed: boolean
  configuration: FormalizationSignatureConfiguration | undefined
  controller: FormalizationSignatureConfigurationController
}

export function useFormalizationSendingConfigurationSummary({
  isPackageConfirmed,
  configuration,
  controller,
}: FormalizationSendingConfigurationSummaryProps) {
  const isForbidden =
    (controller.configurationError as { statusCode?: number } | null)?.statusCode === 403

  function getStatusLabel() {
    if (!isPackageConfirmed) return 'Aguardando confirmação do pacote'
    if (controller.isConfigurationError && !configuration) {
      return isForbidden ? 'Acesso restrito' : 'Erro'
    }
    if (controller.isLoadingConfiguration && !configuration) return 'Carregando'
    if (controller.isInitializationRequired || !configuration) {
      return 'Inicialização necessária'
    }
    if (configuration.status === 'preparing_configuration') {
      return 'Preparando configuração'
    }
    if (configuration.status === 'ready_for_sending') return 'Pronto para envio'
    if (configuration.status === 'read_only') return 'Somente leitura'
    return 'Em configuração'
  }

  const metrics = configuration
    ? [
        { label: 'Signatários', value: String(configuration.signatories.length) },
        { label: 'Documentos', value: String(configuration.documents.length) },
        {
          label: 'Atribuições',
          value: String(configuration.readiness.assignmentCount),
        },
      ]
    : []

  return {
    isForbidden,
    isLoading: controller.isLoadingConfiguration && !configuration,
    metrics,
    statusLabel: getStatusLabel(),
  }
}
