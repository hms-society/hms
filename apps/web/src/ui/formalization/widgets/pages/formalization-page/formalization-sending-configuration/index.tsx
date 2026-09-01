import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'

export const FormalizationSendingConfiguration = () => (
  <Card className='border border-border shadow-sm'>
    <CardContent className='space-y-4 p-5 sm:p-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <Icon name='send' className='size-5 text-primary' />
          <h2 className='font-serif text-xl font-semibold'>Configuração do envio</h2>
        </div>
        <Badge variant='attention'>Aguardando confirmação do pacote</Badge>
      </div>
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
        <Button variant='ghost' disabled aria-label='Configurar envio'>
          <Icon name='lock' className='size-4' />
          Configurar envio
        </Button>
      </div>
    </CardContent>
  </Card>
)
