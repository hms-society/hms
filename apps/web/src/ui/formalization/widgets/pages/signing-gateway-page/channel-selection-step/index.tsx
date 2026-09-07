import { BadgeCheck, Mail, Send } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Label } from '@/ui/shadcn/label'
import { useChannelSelectionStep } from './use-channel-selection-step'

export type { ChannelSelectionStepProps } from './use-channel-selection-step'
import type { ChannelSelectionStepProps } from './use-channel-selection-step'

export const ChannelSelectionStep = (props: ChannelSelectionStepProps) => {
  const { handleContinue, handleSelect, isPending, selectedChannelId } =
    useChannelSelectionStep(props)

  return (
    <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6'>
      <Card className='w-full max-w-xl overflow-hidden border border-border shadow-md'>
        <CardHeader className='gap-4 p-8 pb-0'>
          <div className='flex items-center gap-2 text-accent-foreground'>
            <BadgeCheck aria-hidden='true' className='size-4 text-brand-accent' />
            <p className='text-xs font-bold tracking-widest'>CONFIRME SUA IDENTIDADE</p>
          </div>
          <div className='space-y-2'>
            <h1 className='font-serif text-3xl font-semibold leading-tight tracking-tight'>
              Confirme seu e-mail
            </h1>
            <p className='max-w-md text-sm leading-6 text-muted-foreground'>
              Escolha um contato cadastrado e autorizado para receber o código de
              verificação.
            </p>
          </div>
        </CardHeader>
        <CardContent className='space-y-5 p-8'>
          <fieldset className='space-y-3'>
            <legend className='text-sm font-medium'>Canal de confirmação</legend>
            {props.channels.length === 0 ? (
              <p
                className='rounded-xl border border-badge-attention-border bg-badge-attention p-4 text-sm text-badge-attention-foreground'
                role='status'
              >
                Nenhum canal de confirmação está disponível no momento.
              </p>
            ) : (
              props.channels.map((channel) => (
                <Label
                  key={channel.id}
                  className='group flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-highlight has-[:checked]:border-primary has-[:checked]:bg-highlight'
                >
                  <input
                    className='mt-1 size-4 accent-primary'
                    type='radio'
                    name='signing-channel'
                    value={channel.id}
                    checked={
                      selectedChannelId === channel.id ||
                      (!selectedChannelId && props.channels.length === 1)
                    }
                    onChange={() => handleSelect(channel.id)}
                  />
                  <span className='flex min-w-0 items-start gap-3'>
                    <Mail
                      aria-hidden='true'
                      className='mt-0.5 size-5 shrink-0 text-primary'
                    />
                    <span className='flex flex-col gap-1'>
                      <span className='font-medium text-foreground'>
                        {channel.maskedDestination}
                      </span>
                      <span className='text-xs font-normal text-muted-foreground'>
                        Receber código por e-mail
                      </span>
                    </span>
                  </span>
                </Label>
              ))
            )}
          </fieldset>
          <Button
            className='w-full'
            disabled={isPending || props.channels.length !== 1}
            onClick={handleContinue}
          >
            <Send aria-hidden='true' />
            Enviar código
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
