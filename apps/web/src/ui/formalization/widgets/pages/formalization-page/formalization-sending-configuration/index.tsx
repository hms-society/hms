import { useState, type ReactNode } from 'react'
import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'

import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
import type { FormalizationSignatureSendingController } from '@/ui/formalization/hooks/use-formalization-signature-sending-action'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { SignatoriesTab } from './signatories-tab'
import { SignatureFieldsTab } from './signature-fields-tab'
import { useFormalizationSendingConfiguration } from './use-formalization-sending-configuration'

type SignatureConfiguration = FormalizationSignatureConfiguration | undefined

export type FormalizationSendingConfigurationProps = {
  formalizationId: string
  expectedVersion: number
  isPackageConfirmed: boolean
  isReadOnly?: boolean
  configuration: SignatureConfiguration
  controller: FormalizationSignatureConfigurationController
  sending?: FormalizationSignatureSendingController
}

function getStatusLabel(status: FormalizationSignatureConfiguration['status']) {
  if (status === 'preparing_configuration') return 'Preparando configuração'
  if (status === 'ready_for_sending') return 'Pronto para envio'
  if (status === 'read_only') return 'Somente leitura'
  if (status === 'configuring') return 'Em configuração'
  return 'Configuração'
}

function getIssueLabel(issue: string) {
  const labels: Record<string, string> = {
    package_unconfirmed: 'Confirme o pacote de documentos.',
    initialization_required: 'Inicialize a configuração.',
    preparation_pending: 'Aguarde a preparação dos documentos.',
    preview_failed: 'Revise a prévia que falhou.',
    version_not_approved: 'Aguarde a aprovação da versão do documento.',
    document_unassigned: 'Atribua todos os documentos.',
    signatory_unassigned: 'Atribua os signatários aos documentos.',
    field_missing: 'Adicione um campo de assinatura.',
    selected_channel_missing: 'Escolha um canal para cada signatário.',
    selected_channel_unavailable: 'Escolha um canal disponível.',
    not_ready: 'A configuração ainda não está pronta para envio.',
    stale_configuration: 'Atualize a configuração antes de enviar.',
    document_unavailable: 'Verifique se os documentos estão disponíveis.',
    missing_assignment: 'Atribua todos os documentos e signatários.',
    missing_field: 'Adicione os campos de assinatura obrigatórios.',
    channel_unavailable: 'Verifique o canal de envio de cada signatário.',
    consent_unavailable: 'Verifique o consentimento de comunicação do signatário.',
  }
  return labels[issue] ?? 'Revise a configuração antes de enviar.'
}

export const FormalizationSendingConfigurationPanel = ({
  formalizationId: _formalizationId,
  expectedVersion,
  isPackageConfirmed,
  isReadOnly = false,
  configuration,
  controller,
  sending,
}: FormalizationSendingConfigurationProps) => {
  const widget = useFormalizationSendingConfiguration()
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const sendingController =
    sending ??
    ({
      review: undefined,
      status: undefined,
      reviewError: null,
      statusError: null,
      isLoadingReview: false,
      isFetchingReview: false,
      isLoadingStatus: false,
      isConfirming: false,
      isCancelling: false,
      isCancellationPending: false,
      confirmError: null,
      cancelError: null,
      confirmSending: async () => undefined,
      cancelSending: async () => undefined,
      refetchReview: async () => undefined,
      refetchStatus: async () => undefined,
    } as unknown as FormalizationSignatureSendingController)
  const isForbidden =
    (controller.configurationError as { statusCode?: number } | null)?.statusCode === 403
  const confirmErrorStatus = (
    sending?.confirmError as { statusCode?: number } | null | undefined
  )?.statusCode

  if (!isPackageConfirmed) {
    return (
      <ConfigurationShell status='Aguardando confirmação do pacote'>
        <div className='flex flex-col gap-4 rounded-xl bg-muted/60 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-start gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border'>
              <Icon name='lock' className='size-4' />
            </span>
            <div>
              <h3 className='font-medium'>
                Confirme o pacote de documentos para configurar o envio
              </h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                Depois da confirmação, você poderá revisar os signatários e escolher os
                canais de envio.
              </p>
            </div>
          </div>
          <Button variant='ghost' disabled aria-label='Configurar envio'>
            <Icon name='lock' className='size-4' /> Configurar envio
          </Button>
        </div>
      </ConfigurationShell>
    )
  }

  if (
    controller.isLoadingConfiguration ||
    (controller.isFetchingConfiguration && !configuration)
  ) {
    return (
      <ConfigurationShell status='Carregando'>
        <div
          aria-busy='true'
          className='rounded-xl bg-muted/50 p-6 text-sm text-muted-foreground'
        >
          Carregando configuração do envio...
        </div>
      </ConfigurationShell>
    )
  }

  if (controller.isConfigurationError && !configuration) {
    return (
      <ConfigurationShell status={isForbidden ? 'Acesso restrito' : 'Erro'}>
        <div
          role='alert'
          className='rounded-xl border border-destructive/30 bg-destructive/5 p-5'
        >
          <h3 className='font-medium'>
            {isForbidden ? 'Acesso restrito' : 'Não foi possível carregar a configuração'}
          </h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            {isForbidden
              ? 'Você não tem permissão para configurar este envio.'
              : 'Tente novamente para atualizar os dados.'}
          </p>
          {!isForbidden && (
            <Button
              className='mt-4'
              variant='outline'
              onClick={() => void controller.refetchConfiguration()}
            >
              Tentar novamente
            </Button>
          )}
        </div>
      </ConfigurationShell>
    )
  }

  if (
    controller.isInitializationRequired ||
    configuration?.status === 'initialization_required'
  ) {
    return (
      <ConfigurationShell status='Inicialização necessária'>
        <div className='rounded-xl bg-muted/50 p-5'>
          <h3 className='font-medium'>Inicialize a configuração do envio</h3>
          <p className='mt-1 text-sm text-muted-foreground'>
            Os dados padrão do cliente e do responsável serão preparados para revisão.
          </p>
          <Button
            className='mt-4'
            onClick={() => void controller.initializeConfiguration(expectedVersion)}
            disabled={controller.isInitializingConfiguration}
          >
            {controller.isInitializingConfiguration
              ? 'Inicializando...'
              : 'Inicializar configuração'}
          </Button>
          {Boolean(controller.initializationError) && (
            <p role='alert' className='mt-3 text-sm text-destructive'>
              Não foi possível inicializar a configuração.
            </p>
          )}
        </div>
      </ConfigurationShell>
    )
  }

  if (!configuration) return null

  const readinessIssues = configuration.readiness.issues
  const hasIncompleteSignatoryConfiguration = configuration.signatories.some(
    (signatory) =>
      signatory.documentIds.length === 0 ||
      signatory.selectedChannels.length === 0 ||
      signatory.selectedChannels.some(
        (channel) => !signatory.availableChannels.includes(channel),
      ),
  )
  const canOpenSummary = configuration.readiness.ready
  const activeTab =
    !canOpenSummary && widget.activeTab === 'summary' ? 'signatories' : widget.activeTab
  const isConfigurationReady =
    configuration.readiness.ready && configuration.status === 'ready_for_sending'
  const currentRequest = sendingController.review?.currentRequest
  const hasOpenRequest = Boolean(currentRequest)
  const isRequestCancelled = currentRequest?.status === 'cancelled'
  const isRequestConfirmed = currentRequest?.status === 'confirmed'
  const canResendCancelledRequest =
    isRequestCancelled &&
    currentRequest?.signatureConfigurationVersion !== undefined &&
    currentRequest.signatureConfigurationVersion !== configuration.version
  const canEdit =
    configuration.editable &&
    !isReadOnly &&
    configuration.status !== 'read_only' &&
    (!hasOpenRequest || isRequestCancelled)
  const displayedConfiguration =
    configuration.editable === canEdit
      ? configuration
      : { ...configuration, editable: canEdit }
  const isCancellationPending = sendingController.isCancellationPending
  const isSendingReviewReady = sendingController.review?.ready === true
  const isRefreshingReview =
    sendingController.isLoadingReview || sendingController.isFetchingReview
  const canOpenSendingReview =
    isConfigurationReady && canEdit && (!hasOpenRequest || canResendCancelledRequest)
  const canResetConfiguration =
    canEdit && (!hasOpenRequest || isRequestCancelled) && !isCancellationPending
  const canConfirmSending =
    canOpenSendingReview &&
    isSendingReviewReady &&
    !isRefreshingReview &&
    !sendingController.reviewError
  const sendingExpectedVersion = sendingController.review?.version ?? expectedVersion
  const sendingStatusLabel = !isConfigurationReady
    ? getStatusLabel(configuration.status)
    : isCancellationPending
      ? 'Cancelamento em andamento'
      : isRequestCancelled
        ? canResendCancelledRequest
          ? 'Pronto para reenvio'
          : 'Envio cancelado'
        : isRequestConfirmed
          ? 'Envio concluído'
          : hasOpenRequest
            ? 'Envio em andamento'
            : !canEdit
              ? 'Somente leitura'
              : isRefreshingReview
                ? 'Validando envio'
                : sendingController.reviewError
                  ? 'Revisão indisponível'
                  : isSendingReviewReady
                    ? 'Pronto para envio'
                    : 'Revisão necessária'
  const progressTotal = configuration.previewPreparation.total
  const progressCompleted = Math.min(
    progressTotal,
    configuration.previewPreparation.ready,
  )
  const progressPercent =
    progressTotal > 0 ? (progressCompleted / progressTotal) * 100 : 0

  async function handleResetConfiguration() {
    await controller.resetSignatureConfiguration(expectedVersion)
    widget.handleTabChange('signatories')
  }

  function handleOpenSendingReview() {
    setIsReviewOpen(true)
    if (!isRefreshingReview) void sendingController.refetchReview()
  }

  return (
    <Card className='border border-border shadow-sm'>
      <CardHeader className='gap-4 p-5 sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <h2 className='flex items-center gap-2 font-serif text-xl'>
            <Icon name='send' className='size-5 text-primary' />
            Configuração do envio
          </h2>
          <Badge
            variant={canConfirmSending || isRequestConfirmed ? 'success' : 'attention'}
          >
            {sendingStatusLabel}
          </Badge>
        </div>
        {controller.isPreparingConfiguration && (
          <div className='space-y-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground'>
            <div className='flex items-center justify-between gap-3'>
              <span>Preparando prévias dos documentos...</span>
              <span>
                {progressCompleted}/{progressTotal}
              </span>
            </div>
            <div
              className='h-2 overflow-hidden rounded-full bg-background'
              role='progressbar'
              aria-valuemin={0}
              aria-valuemax={progressTotal}
              aria-valuenow={progressCompleted}
            >
              <div
                className='h-full bg-primary transition-[width]'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className='space-y-5 px-5 pb-5 sm:px-6 sm:pb-6'>
        <div className='grid gap-3 sm:grid-cols-3'>
          <SummaryMetric
            label='Signatários'
            value={String(configuration.signatories.length)}
          />
          <SummaryMetric
            label='Documentos'
            value={String(configuration.documents.length)}
          />
          <SummaryMetric
            label='Atribuições'
            value={String(configuration.readiness.assignmentCount)}
          />
        </div>
        {readinessIssues.length > 0 && (
          <div
            className='rounded-xl border border-attention/40 bg-attention/10 p-4'
            role='status'
          >
            <h3 className='font-medium'>Ainda faltam alguns passos</h3>
            <ul className='mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground'>
              {readinessIssues.map((issue) => (
                <li key={`${issue.path}-${issue.code}`}>{getIssueLabel(issue.code)}</li>
              ))}
            </ul>
          </div>
        )}
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value === 'summary' && !canOpenSummary) return
            widget.handleTabChange(value as typeof widget.activeTab)
          }}
        >
          <TabsList className='grid h-auto w-full grid-cols-3'>
            <TabsTrigger value='signatories'>Signatários</TabsTrigger>
            <TabsTrigger value='fields' disabled={hasIncompleteSignatoryConfiguration}>
              Campos
            </TabsTrigger>
            <TabsTrigger value='summary' disabled={!canOpenSummary}>
              Resumo
            </TabsTrigger>
          </TabsList>
          <TabsContent value='summary' className='space-y-4 pt-4'>
            <div className='rounded-xl border border-border p-4'>
              <h3 className='font-medium'>Revisão do envio</h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                Revise signatários, atribuições, canais e campos antes do envio.
              </p>
            </div>
            {!isRequestConfirmed && (
              <Button
                type='button'
                disabled={!canOpenSendingReview}
                className='w-full sm:w-auto'
                onClick={handleOpenSendingReview}
              >
                <Icon name='send' className='size-4' />{' '}
                {canResendCancelledRequest
                  ? 'Revisar e reenviar'
                  : 'Revisar e iniciar envio'}
              </Button>
            )}
            <p id='formalization-send-help' className='text-xs text-muted-foreground'>
              {!isConfigurationReady
                ? 'Complete a configuração para habilitar o envio.'
                : isRequestConfirmed
                  ? 'Todos os documentos foram assinados e o envio foi concluído.'
                  : canResendCancelledRequest
                    ? 'O envio anterior foi cancelado. Revise os dados para iniciar um novo envio.'
                    : !canEdit
                      ? 'A configuração está disponível somente para leitura.'
                      : hasOpenRequest
                        ? isRequestCancelled
                          ? 'O envio foi cancelado.'
                          : 'Já existe um envio em andamento para esta configuração.'
                        : isRefreshingReview
                          ? 'A revisão do envio está sendo validada.'
                          : sendingController.reviewError
                            ? 'Abra a revisão para tentar carregar os dados novamente.'
                            : !isSendingReviewReady
                              ? 'Abra a revisão para consultar as pendências antes de confirmar.'
                              : 'Revise os dados e confirme para iniciar o envio.'}
            </p>
            {hasOpenRequest && (
              <div className='rounded-xl border border-primary/30 bg-primary/5 p-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <h3 className='font-medium'>
                      {isCancellationPending
                        ? 'Cancelamento do envio em andamento'
                        : isRequestCancelled
                          ? 'Envio de assinaturas cancelado'
                          : isRequestConfirmed
                            ? 'Envio de assinaturas concluído'
                            : 'Envio de assinaturas em andamento'}
                    </h3>
                    {isCancellationPending ? (
                      <p className='mt-1 text-sm text-muted-foreground'>
                        Revogando o envio e atualizando o estado do provedor...
                      </p>
                    ) : !isRequestCancelled ? (
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {sendingController.status
                          ? `${sendingController.status.completedDocuments}/${sendingController.status.totalDocuments} documentos concluídos.`
                          : 'Atualizando o progresso do envio...'}
                      </p>
                    ) : null}
                  </div>
                  {!isRequestCancelled &&
                    !isCancellationPending &&
                    sendingController.status?.canCancel && (
                      <Button
                        variant='outline'
                        disabled={sendingController.isCancelling}
                        onClick={() => {
                          const expectedRequestVersion = sendingController.status?.version
                          if (!expectedRequestVersion) return
                          void sendingController.cancelSending({
                            expectedRequestVersion,
                            expectedFormalizationVersion: expectedVersion,
                            reason: 'Cancelamento solicitado pelo operador.',
                          })
                        }}
                      >
                        {sendingController.isCancelling
                          ? 'Cancelando...'
                          : 'Cancelar envio'}
                      </Button>
                    )}
                </div>
                {sendingController.cancelError && (
                  <p role='alert' className='mt-3 text-sm text-destructive'>
                    Não foi possível cancelar o envio. Atualize e tente novamente.
                  </p>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value='signatories' className='pt-4'>
            <SignatoriesTab
              formalizationId={_formalizationId}
              expectedVersion={expectedVersion}
              configuration={displayedConfiguration}
            />
          </TabsContent>
          <TabsContent value='fields' className='pt-4'>
            <SignatureFieldsTab
              expectedVersion={expectedVersion}
              configuration={displayedConfiguration}
              onUnsavedChangesChange={widget.handleFieldsDirtyChange}
              onOpenSignatories={() => widget.handleTabChange('signatories')}
            />
          </TabsContent>
        </Tabs>
        <div className='flex flex-wrap justify-between gap-3 border-t border-border pt-4'>
          <p className='text-xs text-muted-foreground'>
            {configuration.status === 'read_only'
              ? 'Esta configuração está bloqueada.'
              : 'Alterações são salvas com controle de versão.'}
          </p>
          <Button
            variant='outline'
            disabled={
              !canResetConfiguration || controller.isResettingSignatureConfiguration
            }
            onClick={() => widget.setIsResetDialogOpen(true)}
          >
            Redefinir configuração
          </Button>
        </div>
      </CardContent>
      <AlertDialog
        open={widget.isUnsavedChangesDialogOpen}
        onOpenChange={widget.handleUnsavedChangesDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do editor de campos?</AlertDialogTitle>
            <AlertDialogDescription>
              Existem alterações de campos não salvas. Se você sair agora, elas serão
              descartadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={widget.handleConfirmUnsavedChanges}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={widget.isResetDialogOpen}
        onOpenChange={widget.setIsResetDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir configuração?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove atribuições, canais e campos de assinatura e restaura os
              signatários padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={controller.isResettingSignatureConfiguration}
              onClick={() => void handleResetConfiguration().catch(() => undefined)}
            >
              Redefinir configuração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className='max-h-[calc(100vh-1.5rem)] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Revisar e iniciar envio</DialogTitle>
            <DialogDescription>
              Confirme os documentos e signatários. O convite será enviado por e-mail após
              a preparação segura do provedor.
            </DialogDescription>
          </DialogHeader>
          {isRefreshingReview ? (
            <div aria-busy='true' className='rounded-lg bg-muted/50 p-4 text-sm'>
              {sendingController.isLoadingReview
                ? 'Carregando revisão...'
                : 'Atualizando revisão...'}
            </div>
          ) : sendingController.reviewError ? (
            <div
              role='alert'
              className='space-y-3 rounded-lg border border-destructive/30 p-4'
            >
              <p>Não foi possível carregar a revisão do envio.</p>
              <Button
                type='button'
                variant='outline'
                onClick={() => void sendingController.refetchReview()}
              >
                Tentar novamente
              </Button>
            </div>
          ) : sendingController.review ? (
            <div className='space-y-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <SummaryMetric
                  label='Documentos'
                  value={String(sendingController.review.documents.length)}
                />
                <SummaryMetric
                  label='Signatários'
                  value={String(sendingController.review.signatories.length)}
                />
              </div>
              <div className='rounded-lg border border-border p-4 text-sm'>
                <p>{sendingController.review.messagePreview}</p>
                {sendingController.review.issues.length > 0 && (
                  <ul className='mt-3 list-disc space-y-1 pl-5 text-destructive'>
                    {sendingController.review.issues.map((issue) => (
                      <li
                        key={`${issue.code}-${issue.documentId ?? issue.signatoryId ?? 'general'}`}
                      >
                        {getIssueLabel(issue.code)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className='rounded-lg border border-border p-4 text-sm'>
              A revisão do envio ainda não está disponível.
            </div>
          )}
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsReviewOpen(false)}>
              Voltar
            </Button>
            <Button
              disabled={!canConfirmSending || sendingController.isConfirming}
              onClick={() =>
                void sendingController
                  .confirmSending({
                    expectedVersion: sendingExpectedVersion,
                    confirmationKey: crypto.randomUUID(),
                  })
                  .then(() => setIsReviewOpen(false))
              }
            >
              {sendingController.isConfirming ? 'Iniciando...' : 'Confirmar envio'}
            </Button>
          </DialogFooter>
          {sendingController.confirmError && (
            <div
              role='alert'
              className='flex flex-col gap-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between'
            >
              <p>
                {confirmErrorStatus === 409
                  ? 'A configuração foi alterada. Atualize a revisão antes de tentar novamente.'
                  : 'O envio não pôde ser iniciado. Atualize a revisão e tente novamente.'}
              </p>
              <Button
                type='button'
                variant='outline'
                onClick={() => void sendingController.refetchReview()}
              >
                Atualizar revisão
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

const ConfigurationShell = ({
  children,
  status,
}: {
  children: ReactNode
  status: string
}) => (
  <Card className='border border-border shadow-sm'>
    <CardContent className='space-y-4 p-5 sm:p-6'>
      <ConfigurationHeading status={status} />
      {children}
    </CardContent>
  </Card>
)

const ConfigurationHeading = ({ status }: { status: string }) => (
  <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
    <div className='flex items-center gap-2'>
      <Icon name='send' className='size-5 text-primary' />
      <h2 className='font-serif text-xl font-semibold'>Configuração do envio</h2>
    </div>
    <Badge variant='attention'>{status}</Badge>
  </div>
)

const SummaryMetric = ({ label, value }: { label: string; value: string }) => (
  <div className='rounded-xl bg-muted/50 p-3'>
    <p className='text-xs text-muted-foreground'>{label}</p>
    <p className='mt-1 text-lg font-semibold'>{value}</p>
  </div>
)
