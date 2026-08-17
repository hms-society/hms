import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Textarea } from '@/ui/shadcn/textarea'
import { Badge } from '@/ui/shadcn/badge'
import { useState } from 'react'

export type RequestResendModalProps = {
  isOpen: boolean
  onClose: () => void
  recipientName: string
  recipientContact: string
  onSend: (message: string) => void
}

export const RequestResendModal = ({
  isOpen,
  onClose,
  recipientName,
  recipientContact,
  onSend,
}: RequestResendModalProps) => {
  const [message, setMessage] = useState(
    `Olá, ${recipientName.split(' ')[0]}. O documento enviado está incompleto. Por favor, encaminhe um novo arquivo com todos os dados obrigatórios para continuarmos a validação.`,
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[calc(100%-2rem)] !max-w-3xl gap-0 p-0 sm:rounded-2xl'>
        <DialogHeader className='flex flex-row items-start justify-between border-b border-border p-6'>
          <div className='flex flex-col gap-1'>
            <DialogTitle className='font-serif text-2xl font-bold text-foreground'>
              Solicitar reenvio
            </DialogTitle>
            <DialogDescription className='font-sans text-sm text-muted-foreground'>
              Revise a mensagem que será enviada ao remetente.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-6 p-6'>
          <div className='flex flex-col gap-3'>
            <span className='font-sans text-sm font-semibold text-foreground'>
              Destinatário
            </span>
            <div className='flex items-center gap-4 rounded-xl border border-border bg-[#F8F9FA] p-4'>
              <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-border'>
                <Icon name='user' className='size-5 text-[#3D757B]' />
              </div>
              <div className='flex flex-col'>
                <span className='font-sans text-sm font-bold text-foreground'>
                  {recipientName}
                </span>
                <span className='flex items-center gap-1.5 font-sans text-xs text-muted-foreground mt-0.5'>
                  <Icon name='mail' className='size-3.5' />
                  {recipientContact}
                </span>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <span className='font-sans text-sm font-semibold text-foreground'>
                Motivo da recusa
              </span>
              <Badge
                variant='secondary'
                className='bg-[#E1F5F6] text-[#0F5C61] hover:bg-[#E1F5F6] border-0 text-[10px] rounded-pill px-2.5'
              >
                Automático
              </Badge>
            </div>
            <div className='flex items-center gap-3 rounded-xl border border-border bg-[#F8F9FA] p-4'>
              <Icon name='help-circle' className='size-4 text-[#7C4700]' />
              <span className='font-sans text-sm text-foreground'>
                O documento não contém todos os campos obrigatórios.
              </span>
            </div>
          </div>

          <div className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <span className='font-sans text-sm font-semibold text-foreground'>
                Mensagem ao remetente
              </span>
              <span className='font-sans text-xs text-muted-foreground'>Editável</span>
            </div>
            <Textarea
              className='min-h-[120px] resize-none rounded-xl bg-white p-4 font-sans text-sm text-foreground focus-visible:ring-1 focus-visible:ring-brand'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <span className='font-sans text-xs text-muted-foreground'>
              O novo arquivo será recebido como um documento independente.
            </span>
          </div>
        </div>

        <DialogFooter className='border-t border-border p-6 sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            className='rounded-pill font-sans text-sm h-11 px-6 font-semibold'
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            variant='brand'
            className='rounded-pill font-sans text-sm h-11 gap-2 px-6 font-semibold'
            onClick={() => onSend(message)}
          >
            <Icon name='send' className='size-4' />
            Enviar solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
