import type { ReactNode } from 'react'
import type { FormalizationSignatureConfiguration } from '@hms/core/formalization/domain/structures'

import type { FormalizationSignatureConfigurationController } from '@/ui/formalization/hooks/use-formalization-signature-configuration-action'
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
}: FormalizationSendingConfigurationProps) => {
  const widget = useFormalizationSendingConfiguration()
  const isForbidden =
    (controller.configurationError as { statusCode?: number } | null)?.statusCode === 403

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
  const isReady =
    configuration.readiness.ready && configuration.status === 'ready_for_sending'
  const canEdit =
    configuration.editable && !isReadOnly && configuration.status !== 'read_only'
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

  return (
    <Card className='border border-border shadow-sm'>
      <CardHeader className='gap-4 p-5 sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <h2 className='flex items-center gap-2 font-serif text-xl'>
            <Icon name='send' className='size-5 text-primary' />
            Configuração do envio
          </h2>
          <Badge variant={isReady ? 'success' : 'attention'}>
            {getStatusLabel(configuration.status)}
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
              <h3 className='font-medium'>Pronto para revisar</h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                Revise signatários, atribuições, canais e campos antes do envio.
              </p>
            </div>
            <Button
              type='button'
              disabled
              aria-describedby='formalization-send-help'
              className='w-full sm:w-auto'
            >
              <Icon name='send' className='size-4' /> Iniciar envio de assinaturas
            </Button>
            <p id='formalization-send-help' className='text-xs text-muted-foreground'>
              {isReady
                ? 'O envio será habilitado em uma etapa futura.'
                : 'Complete a configuração para habilitar o envio.'}
            </p>
          </TabsContent>
          <TabsContent value='signatories' className='pt-4'>
            <SignatoriesTab
              formalizationId={_formalizationId}
              expectedVersion={expectedVersion}
              configuration={configuration}
            />
          </TabsContent>
          <TabsContent value='fields' className='pt-4'>
            <SignatureFieldsTab
              expectedVersion={expectedVersion}
              configuration={configuration}
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
            disabled={!canEdit || controller.isResettingSignatureConfiguration}
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
