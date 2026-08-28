import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  type FormalizationSendingConfigurationSummaryProps,
  useFormalizationSendingConfigurationSummary,
} from './use-formalization-sending-configuration-summary'

export type { FormalizationSendingConfigurationSummaryProps }

export const FormalizationSendingConfigurationSummary = (
  props: FormalizationSendingConfigurationSummaryProps,
) => {
  const { configuration, controller, isPackageConfirmed } = props
  const { isForbidden, isLoading, metrics, statusLabel } =
    useFormalizationSendingConfigurationSummary(props)
  const isReady = configuration?.status === 'ready_for_sending'
  const isUnavailable = isForbidden || isLoading

  return (
    <Card className='border border-border shadow-sm'>
      <CardHeader className='gap-4 p-5 sm:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <h2 className='flex items-center gap-2 font-serif text-xl'>
            <Icon name='send' className='size-5 text-primary' />
            Configuração do envio
          </h2>
          <Badge variant={isReady ? 'success' : 'attention'}>{statusLabel}</Badge>
        </div>
        <p className='max-w-3xl text-sm text-muted-foreground'>
          Revise signatários, documentos, atribuições, canais e campos antes do envio.
        </p>
      </CardHeader>
      <CardContent className='space-y-5 px-5 pb-5 sm:px-6 sm:pb-6'>
        {!isPackageConfirmed ? (
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
          </div>
        ) : controller.isConfigurationError && !configuration ? (
          <div
            role='alert'
            className='rounded-xl border border-destructive/30 bg-destructive/5 p-5'
          >
            <h3 className='font-medium'>
              {isForbidden
                ? 'Acesso restrito'
                : 'Não foi possível carregar a configuração'}
            </h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              {isForbidden
                ? 'Você não tem permissão para configurar este envio.'
                : 'Abra a configuração para tentar novamente.'}
            </p>
          </div>
        ) : isLoading ? (
          <div
            aria-busy='true'
            className='rounded-xl bg-muted/50 p-5 text-sm text-muted-foreground'
          >
            Carregando configuração do envio...
          </div>
        ) : configuration ? (
          <>
            <div className='grid gap-3 sm:grid-cols-3'>
              {metrics.map((metric) => (
                <div key={metric.label} className='rounded-xl bg-muted/50 p-3'>
                  <p className='text-xs text-muted-foreground'>{metric.label}</p>
                  <p className='mt-1 text-lg font-semibold'>{metric.value}</p>
                </div>
              ))}
            </div>
            <div className='rounded-xl border border-border p-4'>
              <h3 className='font-medium'>
                {isReady ? 'Pronto para revisar' : 'Configuração em andamento'}
              </h3>
              <p className='mt-1 text-sm text-muted-foreground'>
                {isReady
                  ? 'A configuração está pronta para a revisão final antes do envio.'
                  : 'Abra a configuração para concluir os dados necessários para o envio.'}
              </p>
            </div>
          </>
        ) : (
          <div className='rounded-xl bg-muted/50 p-5'>
            <h3 className='font-medium'>Inicialize a configuração do envio</h3>
            <p className='mt-1 text-sm text-muted-foreground'>
              Os dados padrão do cliente e do responsável serão preparados para revisão.
            </p>
          </div>
        )}

        <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4'>
          <p className='text-xs text-muted-foreground'>
            Alterações são salvas com controle de versão.
          </p>
          <Button asChild variant='outline' disabled={isUnavailable}>
            <Anchor
              route='formalizationSendingConfiguration'
              params={{ formalizationId: props.formalizationId }}
            >
              <Icon name='arrow-right' className='size-4' />
              Configuração do envio
            </Anchor>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
