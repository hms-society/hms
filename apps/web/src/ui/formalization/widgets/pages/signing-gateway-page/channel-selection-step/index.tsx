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
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-lg border border-border shadow-sm'>
        <CardHeader>
          <h1 className='font-serif text-3xl'>Confirme seu e-mail</h1>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <fieldset className='flex flex-col gap-3'>
            <legend className='sr-only'>Canal de confirmação</legend>
            {props.channels.map((channel) => (
              <Label key={channel.id} className='flex items-center gap-2'>
                <input
                  type='radio'
                  name='signing-channel'
                  value={channel.id}
                  checked={
                    selectedChannelId === channel.id ||
                    (!selectedChannelId && props.channels.length === 1)
                  }
                  onChange={() => handleSelect(channel.id)}
                />
                {channel.maskedDestination}
              </Label>
            ))}
          </fieldset>
          <Button
            disabled={isPending || props.channels.length !== 1}
            onClick={handleContinue}
          >
            Enviar código
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
