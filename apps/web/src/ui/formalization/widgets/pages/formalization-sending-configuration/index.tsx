import { Button } from '@/ui/shadcn/button'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  FormalizationLoadingPanel,
  FormalizationStatePanel,
} from '../formalization-page/formalization-state-panels'
import { FormalizationSendingConfigurationPanel } from '../formalization-page/formalization-sending-configuration'
import { useFormalizationSendingConfigurationPage } from './use-formalization-sending-configuration-page'

export type FormalizationSendingConfigurationProps = {
  formalizationId: string
}

export const FormalizationSendingConfiguration = ({
  formalizationId,
}: FormalizationSendingConfigurationProps) => {
  const page = useFormalizationSendingConfigurationPage(formalizationId)

  if (page.query.isLoading) return <FormalizationLoadingPanel />
  if (page.query.isError || !page.query.data) {
    return (
      <FormalizationStatePanel
        title='Não foi possível carregar a formalização'
        description='Verifique o acesso e tente novamente.'
        onRetry={() => void page.query.refetch()}
      />
    )
  }

  const { formalization } = page.query.data

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
        expectedVersion={formalization.version}
        isPackageConfirmed={page.documentProduction.isPackageConfirmed}
        isReadOnly={formalization.status !== 'in_progress'}
        configuration={page.signatureConfiguration.configuration}
        controller={page.signatureConfiguration}
      />
    </main>
  )
}
