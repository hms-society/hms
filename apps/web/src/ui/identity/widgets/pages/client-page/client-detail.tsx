import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { useMaskPhone } from '@/ui/shared/hooks/use-mask-phone'
import { useMaskTaxId } from '@/ui/shared/hooks/use-mask-tax-id'
import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useClientCommunicationsQuery } from '@/ui/shared/hooks/use-client-communications-query'

const CHANNEL_ICON_MAP: Record<string, IconName> = {
  whatsapp: 'message-square',
  email: 'mail',
  phone: 'phone',
}

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

  const [channelFilter, setChannelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

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

  const {
    data: communications = [],
    isLoading: isLoadingCommunications,
    isError: isErrorCommunications,
  } = useClientCommunicationsQuery(clientId)

  const filteredCommunications = communications.filter((item: any) => {
    if (channelFilter !== 'all' && item.channel !== channelFilter) {
      return false
    }

    if (typeFilter !== 'all' && item.direction !== typeFilter) {
      return false
    }

    if (periodFilter !== 'all') {
      const itemDate = new Date(item.createdAt).getTime()
      const now = Date.now()
      const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24)

      if (periodFilter === '7days' && diffDays > 7) return false
      if (periodFilter === '30days' && diffDays > 30) return false
      if (periodFilter === '6months' && diffDays > 180) return false
      if (periodFilter === '1year' && diffDays > 365) return false
    }

    return true
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
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-6 mt-22 px-4 sm:px-0'>
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

      <div className='flex items-center justify-between border-b border-border w-full gap-2 sm:gap-4 overflow-x-auto no-scrollbar'>
        {[
          { id: 1, label: 'Dados cadastrais' },
          { id: 2, label: 'Intakes' },
          { id: 3, label: 'Casos' },
          { id: 4, label: 'Comunicações', active: true },
          { id: 5, label: 'Documentos' },
        ].map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1.5 sm:gap-2 pb-3 cursor-pointer whitespace-nowrap border-b-2 transition-colors flex-1 justify-center px-1 sm:px-2 ${
              tab.active
                ? 'border-[#134C50] text-[#134C50]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              className={`flex size-4 sm:size-5 items-center justify-center rounded-full border text-[9px] sm:text-[10px] shrink-0 ${tab.active ? 'border-[#134C50]' : 'border-current'}`}
            >
              {tab.id}
            </span>
            <span className='text-xs sm:text-sm font-medium'>{tab.label}</span>
          </div>
        ))}
      </div>

      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2'>
        <div className='flex flex-wrap items-center gap-3'>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className='w-[160px] bg-card h-9'>
              <SelectValue placeholder='Canal' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos os canais</SelectItem>
              <SelectItem value='whatsapp'>WhatsApp</SelectItem>
              <SelectItem value='email'>E-mail</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className='w-[140px] bg-card h-9'>
              <SelectValue placeholder='Tipo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos os tipos</SelectItem>
              <SelectItem value='inbound'>Recebidas</SelectItem>
              <SelectItem value='outbound'>Enviadas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className='w-[150px] bg-card h-9'>
              <SelectValue placeholder='Período' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todo o período</SelectItem>
              <SelectItem value='7days'>Últimos 7 dias</SelectItem>
              <SelectItem value='30days'>Últimos 30 dias</SelectItem>
              <SelectItem value='6months'>Últimos 6 meses</SelectItem>
              <SelectItem value='1year'>Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        {isLoadingCommunications ? (
          <div className='p-4 text-center text-sm text-muted-foreground'>
            Carregando histórico...
          </div>
        ) : isErrorCommunications ? (
          <div className='p-4 text-center text-sm text-destructive border border-destructive/20 bg-destructive/10 rounded-lg'>
            Erro ao se conectar com a API de histórico.
          </div>
        ) : filteredCommunications.length === 0 ? (
          <div className='p-4 text-center text-sm text-muted-foreground'>
            Nenhuma comunicação encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredCommunications.map((item: any) => (
            <Card key={item.id} className='shadow-none border-border/60'>
              <CardContent className='p-4 flex gap-4'>
                <div className='shrink-0 flex size-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground'>
                  <Icon
                    name={CHANNEL_ICON_MAP[item.channel] || 'info'}
                    className='size-5'
                  />
                </div>
                <div className='flex-1 space-y-2.5'>
                  <div className='flex flex-wrap items-center justify-between gap-4'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium text-muted-foreground'>
                        {item.direction === 'inbound' ? 'Recebida' : 'Enviada'}
                      </span>
                      {item.direction === 'inbound' ? (
                        <Badge className='shadow-none border-transparent font-medium bg-blue-50 text-blue-600'>
                          Cliente
                        </Badge>
                      ) : (
                        <Badge className='shadow-none border-transparent font-medium bg-muted text-muted-foreground'>
                          Interno
                        </Badge>
                      )}
                      {item.channel === 'whatsapp' && (
                        <Badge className='shadow-none border-transparent font-medium bg-sky-50 text-sky-700'>
                          Auto
                        </Badge>
                      )}
                    </div>
                    <span className='text-xs text-muted-foreground'>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(item.createdAt))}
                    </span>
                  </div>
                  <div className='text-sm text-foreground leading-relaxed whitespace-pre-wrap'>
                    {item.content}
                  </div>
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground pt-1'>
                    <Icon name='user' className='size-3.5' />
                    <span>{item.author}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}