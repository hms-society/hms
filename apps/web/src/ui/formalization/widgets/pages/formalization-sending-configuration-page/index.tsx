import { Button } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  FormalizationLoadingPanel,
  FormalizationStatePanel,
} from '@/ui/formalization/widgets/pages/formalization-page/formalization-state-panels'
import { FormalizationSendingConfigurationPanel } from '@/ui/formalization/widgets/pages/formalization-sending-configuration'
import { useFormalizationSendingConfigurationPage } from './use-formalization-sending-configuration-page'

export type FormalizationSendingConfigurationPageProps = {
  formalizationId: string
}

export const FormalizationSendingConfigurationPage = ({
  formalizationId,
}: FormalizationSendingConfigurationPageProps) => {
  const page = useFormalizationSendingConfigurationPage(formalizationId)

  if (page.query.isLoading && !page.signatureSending.status)
    return <FormalizationLoadingPanel />
  const isTrackingOnly = page.signatureSending.status?.viewerMode === 'tracking_only'
  if ((page.query.isError && !isTrackingOnly) || (!page.query.data && !isTrackingOnly)) {
    return (
      <FormalizationStatePanel
        title='Não foi possível carregar a formalização'
        description='Verifique o acesso e tente novamente.'
        onRetry={() => void page.query.refetch()}
      />
    )
  }

  const formalization = page.query.data?.formalization
  const expectedVersion =
    formalization?.version ?? page.signatureSending.status?.formalizationVersion ?? 0

  return (
    <main className='flex w-full flex-col gap-5 pb-10'>
      <Button asChild variant='link' className='h-auto w-fit px-0 text-primary'>
        <Anchor route='formalization' params={{ formalizationId }}>
          <Icon name='arrow-left' className='size-4' />
          Voltar para a formalização
        </Anchor>
      </Button>
      <FormalizationSendingConfigurationPanel
        formalizationId={formalizationId}
        expectedVersion={expectedVersion}
        isPackageConfirmed={isTrackingOnly || page.documentProduction.isPackageConfirmed}
        isReadOnly={isTrackingOnly || formalization?.status !== 'in_progress'}
        configuration={page.signatureConfiguration.configuration}
        controller={page.signatureConfiguration}
        sending={page.signatureSending}
        trackingOnly={isTrackingOnly}
      />
    </main>
  )
}
