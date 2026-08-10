import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { useSearch } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Label } from '@/ui/shadcn/label'
import { Input } from '@/ui/shadcn/input'
import { Separator } from '@/ui/shadcn/separator'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import {
  Search,
  UserRound,
  ExternalLink,
  X,
  UserPlus,
  FileText,
  Phone,
  Mail,
  Check,
} from 'lucide-react'
import type { IntakeFullData } from './schemas/intake-schema'
import type { StepRef } from './step-demand'

export const StepClient = forwardRef<StepRef>((_, ref) => {
  const {
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useFormContext<IntakeFullData>()

  const search = useSearch({ strict: false })
  const activeClientId =
    (search as { clienteId?: string; clientId?: string })?.clienteId ||
    (search as { clienteId?: string; clientId?: string })?.clientId

  const { identityService } = useRestContext()

  const clienteVinculado = watch('clienteVinculado')
  const [busca, setBusca] = useState('')
  const [mostrarResultado, setMostrarResultado] = useState(
    Boolean(clienteVinculado || activeClientId),
  )

  const { data: clientDetails } = useQuery({
    queryKey: ['client', activeClientId],
    queryFn: async () => {
      if (!activeClientId) return null
      const res = await identityService.getClient(activeClientId)
      return res.isSuccessful ? res.body : null
    },
    enabled: Boolean(activeClientId),
  })

  useEffect(() => {
    if (activeClientId) {
      setValue('clienteVinculado', true, { shouldValidate: true })
      setMostrarResultado(true)
    }
  }, [activeClientId, setValue])

  useImperativeHandle(ref, () => ({
    validate: async () => {
      return await trigger(['clienteVinculado'])
    },
  }))

  const handleVincular = () => {
    setValue('clienteVinculado', true, { shouldValidate: true })
  }

  const handleVerCadastro = () => {
    toast.info('Essa funcionalidade será feita.')
  }

  const handleBuscar = () => {
    if (busca.trim()) setMostrarResultado(true)
  }

  const clientName = clientDetails
    ? clientDetails.client.type === 'natural'
      ? clientDetails.client.name
      : clientDetails.client.tradeName || clientDetails.client.legalName
    : busca.trim()

  const clientInitials = clientName
    ? clientName
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : ''

  const clientTaxId = clientDetails?.client.taxId?.value || ''
  const clientPhone = clientDetails?.client.phone || ''
  const clientEmail = clientDetails?.client.email || ''

  return (
    <div className='flex flex-col gap-5'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <UserRound className='w-4 h-4 text-primary' />
            <span className='text-[16px] font-serif text-foreground'>
              Vincular pessoa ao intake
            </span>
          </div>
          {clienteVinculado && (
            <Badge
              variant='outline'
              className='text-primary border-primary/30 bg-primary/5 rounded-pill'
            >
              <Check className='w-3 h-3' />
              Vinculado
            </Badge>
          )}
        </div>

        {errors.clienteVinculado && (
          <span className='text-[12px] text-destructive'>
            {errors.clienteVinculado.message}
          </span>
        )}

        <Separator />

        <div className='flex flex-col gap-1.5'>
          <Label>Buscar por telefone ou nome:</Label>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                placeholder='(00) 00000-0000 ou nome'
                className='pl-8'
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </div>
            <Button onClick={handleBuscar}>
              <Search />
              Buscar
            </Button>
          </div>
        </div>

        {mostrarResultado && (
          <div className='flex items-start justify-between bg-muted/40 border border-border rounded-xl p-4 gap-4'>
            <div className='flex items-start gap-3'>
              <Avatar>
                <AvatarFallback className='bg-primary/15 text-primary text-[13px] font-bold'>
                  {clientInitials || 'CL'}
                </AvatarFallback>
              </Avatar>
              <div className='flex flex-col gap-1'>
                <div className='flex items-center gap-2'>
                  <span className='text-[14px] font-semibold text-foreground'>
                    {clientName}
                  </span>
                  <Badge
                    variant='outline'
                    className='text-primary border-primary/30 bg-primary/5 rounded-pill text-[11px]'
                  >
                    Interessado
                  </Badge>
                </div>
                {clientTaxId && (
                  <span className='flex items-center gap-1.5 text-[12px] text-muted-foreground'>
                    <FileText className='w-3.5 h-3.5' /> {clientTaxId}
                  </span>
                )}
                {clientPhone && (
                  <span className='flex items-center gap-1.5 text-[12px] text-muted-foreground'>
                    <Phone className='w-3.5 h-3.5' /> {clientPhone}
                  </span>
                )}
                {clientEmail && (
                  <span className='flex items-center gap-1.5 text-[12px] text-muted-foreground'>
                    <Mail className='w-3.5 h-3.5' /> {clientEmail}
                  </span>
                )}
              </div>
            </div>
            <div className='flex items-center gap-2 shrink-0'>
              <Button size='lg' className='h-14 min-h-14' onClick={handleVerCadastro}>
                <ExternalLink />
                Ver cadastro
              </Button>
              <Button
                size='lg'
                variant='outline'
                className='h-14 min-h-14'
                onClick={handleVincular}
              >
                <Check className='w-4 h-4' />
                Vincular
              </Button>
              <button
                type='button'
                className='text-muted-foreground hover:text-foreground transition-colors'
                onClick={() => setMostrarResultado(false)}
              >
                <X className='w-4 h-4' />
              </button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <Button variant='brand' className='w-full rounded-pill py-3 h-auto'>
        <UserPlus />
        Cadastrar nova pessoa
      </Button>
    </div>
  )
})

StepClient.displayName = 'StepClient'
