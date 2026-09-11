import type { ReactNode } from 'react'
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
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { SignatureFieldsTab } from './signature-fields-tab'
import { SignatoriesTab } from './signatories-tab'
import { SignatureTrackingPanel } from './signature-tracking-panel'
import { useFormalizationSendingConfiguration } from './use-formalization-sending-configuration'

export type FormalizationSendingConfigurationProps = {
  formalizationId: string
  expectedVersion: number
  isPackageConfirmed: boolean
  isReadOnly?: boolean
  configuration: FormalizationSignatureConfiguration | undefined
  controller: FormalizationSignatureConfigurationController
  sending?: FormalizationSignatureSendingController
  trackingOnly?: boolean
}

export const FormalizationSendingConfigurationPanel = ({
  configuration,
  controller,
  expectedVersion,
  formalizationId,
  isPackageConfirmed,
  isReadOnly = false,
  sending,
  trackingOnly = false,
}: FormalizationSendingConfigurationProps) => {
  const sendingController = sending ?? createEmptySendingController()
  const currentRequest = sendingController.review?.currentRequest
  const status = sendingController.status
  const isCancellationPending = sendingController.isCancellationPending
  const isCancelled =
    status?.status === 'cancelled' || currentRequest?.status === 'cancelled'
  const isTrackingVisible = trackingOnly || Boolean(status && !isCancelled)
  const canReset = Boolean(
    configuration?.editable && isCancelled && !isCancellationPending,
  )
  const canEdit = Boolean(
    configuration?.editable &&
      !isReadOnly &&
      !isTrackingVisible &&
      !isCancellationPending,
  )
  const isInitializationRequired = Boolean(
    controller.isInitializationRequired ||
      configuration?.status === 'initialization_required',
  )
  const isReady = Boolean(
    configuration?.readiness.ready && configuration.status === 'ready_for_sending',
  )
  const canSend = Boolean(sending) && canEdit && isReady
  const {
    activeTab,
    handleConfirmUnsavedChanges,
    handleFieldsDirtyChange,
    handleSend,
    handleTabChange,
    handleUnsavedChangesDialogOpenChange,
    isResetDialogOpen,
    isSendDialogOpen,
    isUnsavedChangesDialogOpen,
    setIsResetDialogOpen,
    setIsSendDialogOpen,
  } = useFormalizationSendingConfiguration({
    canSend,
    expectedVersion,
    sending: sendingController,
  })

  if (!isPackageConfirmed && !trackingOnly) {
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
                Depois da confirmação, você poderá revisar os signatários e acompanhar as
                assinaturas.
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

  if (trackingOnly && !sendingController.status) {
    return (
      <ConfigurationShell status='Acompanhamento indisponível'>
        <StateMessage
          isError
          message='Não foi possível carregar o acompanhamento das assinaturas.'
          onRetry={() => void sendingController.refetchStatus()}
        />
      </ConfigurationShell>
    )
  }

  if (controller.isLoadingConfiguration && !configuration && !trackingOnly) {
    return (
      <ConfigurationShell status='Carregando'>
        <StateMessage message='Carregando configuração do envio…' />
      </ConfigurationShell>
    )
  }

  if (isInitializationRequired && !configuration && !trackingOnly) {
    return (
      <ConfigurationShell status='Inicialização necessária'>
        <div className='flex flex-col gap-4 rounded-xl bg-muted/60 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h3 className='font-medium'>Inicialize a configuração do envio</h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              A configuração precisa ser criada antes de adicionar signatários e atribuir
              documentos.
            </p>
          </div>
          <Button
            type='button'
            className='shrink-0'
            disabled={controller.isInitializingConfiguration}
            onClick={() => void controller.initializeConfiguration(expectedVersion)}
          >
            <Icon name='send' className='size-4' />
            {controller.isInitializingConfiguration
              ? 'Inicializando...'
              : 'Inicializar configuração'}
          </Button>
        </div>
        {Boolean(controller.initializationError) && (
          <p className='mt-3 text-sm text-destructive' role='alert'>
            Não foi possível inicializar a configuração. Tente novamente.
          </p>
        )}
      </ConfigurationShell>
    )
  }

  if (controller.isConfigurationError && !configuration && !trackingOnly) {
    const isForbidden =
      (controller.configurationError as { statusCode?: number } | null)?.statusCode ===
      403
    return (
      <ConfigurationShell status={isForbidden ? 'Acesso restrito' : 'Erro'}>
        <StateMessage
          isError
          message={
            isForbidden
              ? 'Você não tem permissão para configurar este envio.'
              : 'Não foi possível carregar a configuração.'
          }
          onRetry={isForbidden ? undefined : () => void controller.refetchConfiguration()}
        />
      </ConfigurationShell>
    )
  }

  if (isTrackingVisible && status) {
    return (
      <Card className='border border-border shadow-sm'>
        <CardHeader className='flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
          <div className='flex items-center gap-2'>
            <Icon name='send' className='size-5 text-primary' />
            <h2 className='font-serif text-xl font-semibold'>Configuração do envio</h2>
          </div>
          <Badge variant={status.status === 'confirmed' ? 'success' : 'attention'}>
            {getRequestStatusLabel(status.status)}
          </Badge>
        </CardHeader>
        <CardContent className='p-5 sm:p-6'>
          <SignatureTrackingPanel
            formalizationId={formalizationId}
            formalizationVersion={status.formalizationVersion}
            status={status}
            isRefreshing={
              sendingController.isFetchingReview || sendingController.isLoadingStatus
            }
            isResending={sendingController.isResending}
            isCancelling={sendingController.isCancelling || isCancellationPending}
            resendError={sendingController.resendError}
            cancelError={sendingController.cancelError}
            onRefresh={async () => {
              await sendingController.refetchReview()
              await sendingController.refetchStatus()
            }}
            onResend={async (recipientId, input) =>
              sendingController.resendInvitation({ recipientId, input })
            }
            onCancel={async (input) => sendingController.cancelSending(input)}
          />
        </CardContent>
      </Card>
    )
  }

  if (!configuration) return null

  const displayedConfiguration = canEdit
    ? configuration
    : { ...configuration, editable: false }
  const fieldsDisabled = configuration.signatories.some(
    (signatory) =>
      signatory.documentIds.length === 0 || signatory.selectedChannels.length === 0,
  )
  async function handleReset() {
    await controller.resetSignatureConfiguration(expectedVersion)
    setIsResetDialogOpen(false)
    handleTabChange('signatures')
  }

  return (
    <Card className='border border-border shadow-sm'>
      <CardHeader className='flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <div className='flex items-center gap-2'>
          <Icon name='send' className='size-5 text-primary' />
          <h2 className='font-serif text-xl font-semibold'>Configuração do envio</h2>
        </div>
        <Badge variant={isReady ? 'success' : 'attention'}>
          {getConfigurationStatusLabel(configuration.status)}
        </Badge>
      </CardHeader>
      <CardContent className='space-y-5 p-5 sm:p-6'>
        <Tabs
          value={activeTab}
          onValueChange={(value) => handleTabChange(value as 'signatures' | 'fields')}
        >
          <TabsList className='grid h-auto w-full grid-cols-2'>
            <TabsTrigger value='signatures'>Assinaturas</TabsTrigger>
            <TabsTrigger value='fields' disabled={fieldsDisabled}>
              Posicionar campos
            </TabsTrigger>
          </TabsList>
          <TabsContent value='signatures' className='pt-4'>
            <SignatoriesTab
              formalizationId={formalizationId}
              expectedVersion={expectedVersion}
              configuration={displayedConfiguration}
            />
            {isInitializationRequired ? (
              <>
                <div className='mt-4 flex flex-col gap-3 rounded-lg bg-highlight p-4 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <p className='font-medium text-highlight-foreground'>
                      Inicialize a configuração para adicionar signatários
                    </p>
                    <p className='mt-1 text-sm text-highlight-foreground/80'>
                      Depois disso, você poderá atribuir documentos e canais de contato.
                    </p>
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    disabled={controller.isInitializingConfiguration}
                    onClick={() =>
                      void controller.initializeConfiguration(expectedVersion)
                    }
                  >
                    <Icon name='send' className='size-4' />
                    {controller.isInitializingConfiguration
                      ? 'Inicializando...'
                      : 'Inicializar configuração'}
                  </Button>
                </div>
                {Boolean(controller.initializationError) && (
                  <p className='mt-3 text-sm text-destructive' role='alert'>
                    Não foi possível inicializar a configuração. Tente novamente.
                  </p>
                )}
              </>
            ) : canSend ? (
              <section
                className='mt-4 flex flex-col gap-3 rounded-lg border border-brand/40 bg-brand/5 p-4 sm:flex-row sm:items-center sm:justify-between'
                aria-labelledby='send-signatures-title'
              >
                <div>
                  <h3 id='send-signatures-title' className='font-medium'>
                    Enviar para assinatura
                  </h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    Todos os signatários, documentos e canais estão configurados.
                  </p>
                </div>
                <Button
                  type='button'
                  className='min-h-11 w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto'
                  disabled={sendingController.isConfirming}
                  onClick={() => setIsSendDialogOpen(true)}
                >
                  <Icon name='send' className='size-4' /> Enviar assinaturas
                </Button>
              </section>
            ) : !isReady ? (
              <p
                className='mt-4 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground'
                role='status'
              >
                Complete a configuração para habilitar o envio.
              </p>
            ) : null}
          </TabsContent>
          <TabsContent value='fields' className='pt-4'>
            <SignatureFieldsTab
              expectedVersion={expectedVersion}
              configuration={displayedConfiguration}
              onUnsavedChangesChange={handleFieldsDirtyChange}
              onOpenSignatories={() => handleTabChange('signatures')}
            />
          </TabsContent>
        </Tabs>
        {canReset && (
          <Button
            type='button'
            variant='outline'
            className='min-h-11'
            disabled={controller.isResettingSignatureConfiguration}
            onClick={() => setIsResetDialogOpen(true)}
          >
            Redefinir configuração
          </Button>
        )}
      </CardContent>
      <AlertDialog
        open={isUnsavedChangesDialogOpen}
        onOpenChange={handleUnsavedChangesDialogOpenChange}
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
              onClick={handleConfirmUnsavedChanges}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar assinaturas?</AlertDialogTitle>
            <AlertDialogDescription>
              Os documentos serão enviados aos signatários pelos canais configurados. Após
              o envio, a configuração ficará bloqueada para edição.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {sendingController.confirmError && (
            <p role='alert' className='text-sm text-destructive'>
              Não foi possível enviar as assinaturas. Atualize a configuração e tente
              novamente.
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={sendingController.isConfirming}
              onClick={() => void handleSend()}
            >
              {sendingController.isConfirming ? 'Enviando…' : 'Enviar assinaturas'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir configuração?</AlertDialogTitle>
            <AlertDialogDescription>
              Após o cancelamento confirmado, esta ação restaura a configuração editável
              para um novo envio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={controller.isResettingSignatureConfiguration}
              onClick={() => void handleReset()}
            >
              Redefinir configuração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function createEmptySendingController(): FormalizationSignatureSendingController {
  return {
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
    isResending: false,
    resendError: null,
    confirmError: null,
    cancelError: null,
    confirmSending: async () => undefined,
    resendInvitation: async () => undefined as never,
    cancelSending: async () => undefined,
    refetchReview: async () => undefined,
    refetchStatus: async () => undefined,
  } as unknown as FormalizationSignatureSendingController
}

function getConfigurationStatusLabel(
  status: FormalizationSignatureConfiguration['status'],
) {
  const labels: Record<string, string> = {
    configuring: 'Em configuração',
    preparing_configuration: 'Preparando configuração',
    ready_for_sending: 'Pronto para envio',
    read_only: 'Somente leitura',
    initialization_required: 'Inicialização necessária',
  }
  return labels[status] ?? 'Configuração'
}

function getRequestStatusLabel(status: string) {
  const labels: Record<string, string> = {
    provisioning: 'Provisionando',
    sending: 'Enviando',
    sent: 'Enviado',
    in_progress: 'Em andamento',
    partially_submitted: 'Parcialmente assinado',
    submitted: 'Enviado para confirmação',
    reconciliation_required: 'Reconciliação necessária',
    confirmed: 'Confirmado',
    rejected: 'Rejeitado',
    cancelled: 'Cancelado',
    expired: 'Expirado',
    failed: 'Falhou',
  }
  return labels[status] ?? 'Em andamento'
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
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <Icon name='send' className='size-5 text-primary' />
          <h2 className='font-serif text-xl font-semibold'>Configuração do envio</h2>
        </div>
        <Badge variant='attention'>{status}</Badge>
      </div>
      {children}
    </CardContent>
  </Card>
)

const StateMessage = ({
  isError = false,
  message,
  onRetry,
}: {
  isError?: boolean
  message: string
  onRetry?: () => void
}) => (
  <div
    className={
      isError
        ? 'space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5'
        : 'rounded-xl bg-muted/50 p-5 text-sm text-muted-foreground'
    }
    role={isError ? 'alert' : 'status'}
    aria-busy={!isError && !onRetry}
  >
    {message}
    {onRetry && (
      <div>
        <Button type='button' variant='outline' onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    )}
  </div>
)
