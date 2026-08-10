import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/ui/shadcn/tabs'
import { useMaskPhone } from '@/ui/shared/hooks/use-mask-phone'
import { useMaskTaxId } from '@/ui/shared/hooks/use-mask-tax-id'
import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useQueryState } from 'nuqs'
import { ClientCommunicationsTab } from '../../client-page/client-communications-tab'
import { ClientDocumentsTab } from './client-documents-tab'
import { useNavigate } from '@tanstack/react-router'

function getInitials(name: string) {
  if (!name) return 'UN'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

type ClientDetailsPageProps = {
  clientId: string
}

export function ClientDetailsPage({ clientId }: ClientDetailsPageProps) {
  const { identityService, intakeService } = useRestContext()
  const maskTaxId = useMaskTaxId()
  const maskPhone = useMaskPhone()
  const [activeTab, setActiveTab] = useQueryState('tab', { defaultValue: 'documentos' })
  const navigate = useNavigate()

  const {
    data: clientData,
    isLoading: isLoadingClient,
    error: clientError,
  } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const response = await identityService.getClient(clientId)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })

  const { data: intakesData, isLoading: isLoadingIntakes } = useQuery({
    queryKey: ['intakes', 'client', clientId],
    queryFn: async () => {
      const response = await intakeService.listClientIntake(clientId)
      if (response.isFailure) return []
      return response.body
    },
    enabled: !!clientData,
  })

  if (isLoadingClient || isLoadingIntakes) {
    return (
      <div className='mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6 mt-22 py-12'>
        <span className='text-sm text-muted-foreground'>
          Carregando ficha do cliente...
        </span>
      </div>
    )
  }

  if (clientError || !clientData) {
    return (
      <div className='mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-6 mt-22 py-12'>
        <span className='text-sm text-destructive'>
          Erro ao carregar dados do cliente.
        </span>
      </div>
    )
  }

  const { client, consents } = clientData
  const intakes = intakesData || []
  const displayName =
    client.type === 'natural' ? client.name : client.tradeName || client.legalName
  const initials = getInitials(displayName || 'UN')

  const status =
    intakes.length > 1 ? 'Cliente' : intakes.length === 1 ? 'Interessado' : 'Potencial'

  const statusStyles: Record<string, { badge: string; avatar: string; text: string }> = {
    Cliente: {
      badge: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
      avatar: 'bg-emerald-100',
      text: 'text-emerald-800',
    },
    Interessado: {
      badge: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
      avatar: 'bg-amber-100',
      text: 'text-amber-800',
    },
    Potencial: {
      badge: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      avatar: 'bg-purple-100',
      text: 'text-purple-800',
    },
  }
  const currentStyle = statusStyles[status] || statusStyles.Potencial

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-6 mt-5 px-4 sm:px-0'>
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
          <Button
            className='bg-[#134C50] text-white hover:bg-[#134C50]/90 rounded-full px-6'
            onClick={() =>
              navigate({
                to: '/atendimento/consultas',
                search: { clientId: client.id },
              })
            }
          >
            Novo intake
          </Button>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab || 'documentos'}
        onValueChange={setActiveTab}
        className='w-full mt-2'
      >
        <div className='w-full overflow-x-auto scrollbar-hide'>
          <TabsList variant='line' className='w-full justify-between'>
            <TabsTrigger value='dados-cadastrais'>
              <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current text-[11px] font-semibold'>
                1
              </span>
              Dados cadastrais
            </TabsTrigger>

            <TabsTrigger value='intakes'>
              <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current text-[11px] font-semibold'>
                2
              </span>
              Intakes
            </TabsTrigger>

            <TabsTrigger value='casos'>
              <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current text-[11px] font-semibold'>
                3
              </span>
              Casos
            </TabsTrigger>

            <TabsTrigger value='comunicacoes'>
              <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current text-[11px] font-semibold'>
                4
              </span>
              Comunicações
            </TabsTrigger>

            <TabsTrigger value='documentos'>
              <span className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-current text-[11px] font-semibold'>
                5
              </span>
              Documentos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='dados-cadastrais' className='mt-4 outline-none' />

        <TabsContent value='intakes' className='mt-4 outline-none' />

        <TabsContent value='casos' className='mt-4 outline-none' />

        <TabsContent value='comunicacoes' className='mt-4 outline-none'>
          <ClientCommunicationsTab clientId={clientId} />
        </TabsContent>

        <TabsContent value='documentos' className='mt-4 outline-none'>
          <ClientDocumentsTab clientId={clientId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
