import { useState } from 'react'
import { Badge } from '@/ui/shadcn/badge'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { useClientCommunicationsQuery } from '@/ui/shared/hooks/use-client-communications-query'

const CHANNEL_ICON_MAP: Record<string, IconName> = {
  whatsapp: 'message-square',
  email: 'mail',
  phone: 'phone',
}

type ClientCommunicationsTabProps = {
  clientId: string
}

export function ClientCommunicationsTab({ clientId }: ClientCommunicationsTabProps) {
  const [channelFilter, setChannelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

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

  return (
    <div className='flex flex-col gap-4'>
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