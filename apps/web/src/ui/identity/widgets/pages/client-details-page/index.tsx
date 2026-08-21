import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { ClientCommunicationsTab } from './client-communications-tab'
import { ClientDocumentsTab } from './client-documents-tab'
import {
  type ClientDetailsPageProps,
  useClientDetailsPage,
} from './use-client-details-page'

export type { ClientDetailsPageProps } from './use-client-details-page'

export const ClientDetailsPage = ({ clientId }: ClientDetailsPageProps) => {
  const {
    activeTab,
    clientData,
    clientError,
    consents,
    currentStyle,
    displayName,
    handleTabChange,
    initials,
    isLoading,
    maskPhone,
    maskTaxId,
    status,
  } = useClientDetailsPage({ clientId })

  if (isLoading) {
    return (
      <div className='flex w-full flex-col items-center justify-center gap-6 mt-12 py-12'>
        <span className='text-sm text-muted-foreground'>
          Carregando ficha do cliente...
        </span>
      </div>
    )
  }

  if (
    clientError ||
    !clientData ||
    !consents ||
    !currentStyle ||
    !displayName ||
    !status
  ) {
    return (
      <div className='flex w-full flex-col items-center justify-center gap-6 mt-12 py-12'>
        <span className='text-sm text-destructive'>
          Erro ao carregar dados do cliente.
        </span>
      </div>
    )
  }

  const { client } = clientData

  return (
    <div className='flex w-full flex-col gap-6 mt-12 px-4 sm:px-0'>
      <Anchor
        route='clients'
        className='inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground'
      >
        <Icon name='arrow-left' className='size-4' />
        Voltar
      </Anchor>

      <Card className='shadow-sm'>
        <CardContent className='flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <Avatar className={`size-14 ${currentStyle.avatar}`}>
              <AvatarFallback
                className={`text-lg font-medium bg-transparent ${currentStyle.text}`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-col gap-1.5'>
              <div className='flex items-center gap-3'>
                <h1 className='text-xl font-semibold text-foreground'>{displayName}</h1>
                <Badge
                  variant='secondary'
                  className={`border-transparent shadow-none ${currentStyle.badge}`}
                >
                  {status}
                </Badge>
              </div>
              <div className='flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <Icon name='id-card' className='size-4' />
                  {client.taxId?.value ? maskTaxId(client.taxId.value) : '-'}
                </span>
                <span className='flex items-center gap-1.5'>
                  <Icon name='phone' className='size-4' />
                  {client.phone ? maskPhone(client.phone) : 'Não informado'}
                </span>
                <span className='flex items-center gap-1.5'>
                  <Icon name='mail' className='size-4' />
                  {client.email || 'Não informado'}
                </span>
                {consents.length > 0 && (
                  <span
                    className='flex items-center gap-1.5 text-emerald-600/90'
                    title='Termos de privacidade aceitos'
                  >
                    <Icon name='shield-check' className='size-4' />
                    {consents.length} consentimento(s)
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button className='bg-[#134C50] text-white hover:bg-[#134C50]/90 rounded-full px-6'>
            <Icon name='plus' />
            Novo intake
          </Button>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange} className='w-full'>
        <div className='w-full overflow-x-auto no-scrollbar'>
          <TabsList variant='line' className='w-full justify-between gap-2 sm:gap-4'>
            {[
              { id: 1, value: 'dados-cadastrais', label: 'Dados cadastrais' },
              { id: 2, value: 'intakes', label: 'Intakes' },
              { id: 3, value: 'casos', label: 'Casos' },
              { id: 4, value: 'comunicacoes', label: 'Comunicações' },
              { id: 5, value: 'documentos', label: 'Documentos' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className='flex-1 px-1 sm:px-2'
              >
                <span className='flex size-4 shrink-0 items-center justify-center rounded-full border border-current text-[9px] sm:size-5 sm:text-[10px]'>
                  {tab.id}
                </span>
                <span className='text-xs font-medium sm:text-sm'>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value='dados-cadastrais' className='mt-4' />
        <TabsContent value='intakes' className='mt-4' />
        <TabsContent value='casos' className='mt-4' />
        <TabsContent value='comunicacoes' className='mt-4'>
          <ClientCommunicationsTab clientId={clientId} />
        </TabsContent>
        <TabsContent value='documentos' className='mt-4'>
          <ClientDocumentsTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
