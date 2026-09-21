import type {
  FormalizationSignatureConfiguration,
  FormalizationSignatureRequestStatus,
} from '@hms/core/formalization/domain/structures'

import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'

type SummaryBadgeVariant =
  | 'attention'
  | 'destructive'
  | 'info'
  | 'secondary'
  | 'success'
  | 'waiting'

type SummaryState = {
  badgeVariant: SummaryBadgeVariant
  description?: string
  statusLabel: string
  title?: string
}

export type FormalizationSendingConfigurationSummaryProps = {
  formalizationId: string
  isPackageConfirmed: boolean
  signatureStatus?: FormalizationSignatureRequestStatus
  configuration: FormalizationSignatureConfiguration | undefined
  controller: FormalizationSignatureConfigurationController
}

export function useFormalizationSendingConfigurationSummary({
  isPackageConfirmed,
  signatureStatus,
  configuration,
  controller,
}: FormalizationSendingConfigurationSummaryProps) {
  const isForbidden =
    (controller.configurationError as { statusCode?: number } | null)?.statusCode === 403

  function getSignatureRequestState(
    status: FormalizationSignatureRequestStatus,
  ): SummaryState {
    if (status === 'provisioning' || status === 'sending') {
      return {
        badgeVariant: 'attention',
        description: 'Aguarde enquanto os convites são preparados e enviados.',
        statusLabel: 'Envio em andamento',
        title: 'Envio dos convites em andamento',
      }
    }
    if (
      status === 'sent' ||
      status === 'in_progress' ||
      status === 'partially_submitted' ||
      status === 'submitted'
    ) {
      return {
        badgeVariant: 'attention',
        description: 'Os convites foram enviados. Acompanhe o progresso das assinaturas.',
        statusLabel: 'Envio em andamento',
        title: 'Convites enviados',
      }
    }
    if (status === 'confirmed') {
      return {
        badgeVariant: 'success',
        description: 'Todos os documentos tiveram suas assinaturas confirmadas.',
        statusLabel: 'Confirmado',
        title: 'Assinaturas confirmadas',
      }
    }
    if (status === 'reconciliation_required') {
      return {
        badgeVariant: 'attention',
        description: 'Abra o acompanhamento para verificar as assinaturas pendentes.',
        statusLabel: 'Reconciliação necessária',
        title: 'Acompanhamento necessário',
      }
    }
    if (status === 'failed' || status === 'rejected') {
      return {
        badgeVariant: 'destructive',
        description:
          'Abra o acompanhamento para consultar os detalhes e tentar novamente.',
        statusLabel: status === 'failed' ? 'Falha no envio' : 'Rejeitado',
        title:
          status === 'failed' ? 'Não foi possível concluir o envio' : 'Envio rejeitado',
      }
    }

    return {
      badgeVariant: 'secondary',
      description: 'Abra o acompanhamento para consultar os detalhes deste envio.',
      statusLabel: status === 'cancelled' ? 'Cancelado' : 'Expirado',
      title: status === 'cancelled' ? 'Envio cancelado' : 'Envio expirado',
    }
  }

  function getConfigurationState(): SummaryState {
    if (!isPackageConfirmed) {
      return {
        badgeVariant: 'attention',
        statusLabel: 'Aguardando confirmação do pacote',
      }
    }
    if (controller.isConfigurationError && !configuration) {
      return {
        badgeVariant: 'destructive',
        statusLabel: isForbidden ? 'Acesso restrito' : 'Erro',
      }
    }
    if (controller.isLoadingConfiguration && !configuration) {
      return { badgeVariant: 'secondary', statusLabel: 'Carregando' }
    }
    if (controller.isInitializationRequired || !configuration) {
      return { badgeVariant: 'attention', statusLabel: 'Inicialização necessária' }
    }
    if (configuration.status === 'preparing_configuration') {
      return { badgeVariant: 'info', statusLabel: 'Preparando configuração' }
    }
    if (configuration.status === 'ready_for_sending') {
      return {
        badgeVariant: 'success',
        description: 'A configuração está pronta para a revisão final antes do envio.',
        statusLabel: 'Pronto para envio',
        title: 'Pronto para revisar',
      }
    }
    if (configuration.status === 'configuring') {
      return {
        badgeVariant: 'attention',
        description:
          'Abra a configuração para concluir os dados necessários para o envio.',
        statusLabel: 'Em configuração',
        title: 'Configuração em andamento',
      }
    }
    return { badgeVariant: 'secondary', statusLabel: 'Somente leitura' }
  }

  const state = signatureStatus
    ? getSignatureRequestState(signatureStatus)
    : getConfigurationState()

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
    ...state,
    hasSignatureRequest: Boolean(signatureStatus),
  }
}
