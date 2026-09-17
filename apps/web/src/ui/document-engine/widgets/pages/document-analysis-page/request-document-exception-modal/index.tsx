import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Textarea } from '@/ui/shadcn/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/shadcn/popover'
import { Calendar } from '@/ui/shadcn/calendar'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useRequestDocumentExceptionModal } from './use-request-document-exception-modal'

export type RequestDocumentExceptionModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    documentId: string
    type: string
    justification: string
    deadlineDate?: Date
  }) => Promise<any>
  isLoading?: boolean
  checklistItems?: { id: string; title: string }[]
}

const RequiredMark = () => (
  <span className='ml-1 text-red-500'>*</span>
)

export const RequestDocumentExceptionModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  checklistItems = [],
}: RequestDocumentExceptionModalProps) => {
  const {
    documentId,
    setDocumentId,
    type,
    setType,
    justification,
    setJustification,
    deadlineDate,
    setDeadlineDate,
    isCalendarOpen,
    setIsCalendarOpen,
    isAceiteProvisorio,
    isSubmitDisabled,
    handleSubmit,
    handleClose,
  } = useRequestDocumentExceptionModal({ onSubmit, onClose })

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='w-[calc(100%-2rem)] !max-w-lg gap-0 p-0 bg-white overflow-hidden sm:rounded-2xl'>
        <DialogHeader className='flex flex-row items-start justify-between border-b border-border px-5 py-4'>
          <div className='flex flex-col gap-0.5'>
            <DialogTitle className='font-serif text-xl font-bold text-foreground'>
              Solicitar exceção documental
            </DialogTitle>
            <DialogDescription className='font-sans text-xs text-muted-foreground'>
              Preencha as informações para solicitar uma exceção ao supervisor.
            </DialogDescription>
          </div>
        </DialogHeader>
        <div className='flex flex-col gap-4 px-5 py-4'>
          <div className='flex flex-col gap-2'>
            <span className='font-sans text-sm font-semibold text-foreground'>
              Documento<RequiredMark />
            </span>
            <Select value={documentId} onValueChange={setDocumentId}>
              <SelectTrigger className='h-10 rounded-xl border-border bg-white font-sans text-sm'>
                <SelectValue placeholder='Selecione o documento' />
              </SelectTrigger>
              <SelectContent>
                {checklistItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-2'>
            <span className='font-sans text-sm font-semibold text-foreground'>
              Tipo de exceção<RequiredMark />
            </span>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className='h-10 rounded-xl border-border bg-white font-sans text-sm'>
                <SelectValue placeholder='Selecione o tipo de exceção' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ACEITE_PROVISORIO'>
                  Aceite provisório
                </SelectItem>
                <SelectItem value='DISPENSA_DEFINITIVA'>
                  Dispensa definitiva
                </SelectItem>
              </SelectContent>
            </Select>

            {type && (
              <div className='flex items-start gap-2.5 rounded-lg border border-border bg-[#F8F9FA] px-3 py-2.5'>
                <Icon name='info' className='mt-0.5 size-3.5 shrink-0 text-[#3D757B]' />
                <span className='font-sans text-xs text-muted-foreground'>
                  {type === 'ACEITE_PROVISORIO'
                    ? 'O documento será aceito temporariamente até a data limite. Após esse prazo, a exceção expira automaticamente.'
                    : 'O documento será dispensado de forma definitiva, sem necessidade de reenvio.'}
                </span>
              </div>
            )}
          </div>
          {isAceiteProvisorio && (
            <div className='flex flex-col gap-2'>
              <span className='font-sans text-sm font-semibold text-foreground'>
                Data limite<RequiredMark />
              </span>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='h-10 w-full justify-start rounded-xl border-border bg-white font-sans text-sm font-normal text-foreground'
                  >
                    <Icon name='calendar' className='mr-2 size-4 text-muted-foreground' />
                    {deadlineDate
                      ? format(deadlineDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : 'Selecione a data limite'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={deadlineDate}
                    onSelect={(date) => {
                      setDeadlineDate(date)
                      setIsCalendarOpen(false)
                    }}
                    disabled={(date) => date < new Date()}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          <div className='flex flex-col gap-2'>
            <span className='font-sans text-sm font-semibold text-foreground'>
              Justificativa<RequiredMark />
            </span>
            <Textarea
              className='min-h-[100px] resize-none rounded-xl bg-white p-3 font-sans text-sm text-foreground focus-visible:ring-1 focus-visible:ring-brand'
              placeholder='Descreva o motivo da solicitação de exceção...'
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className='border-t border-border px-7 py-6 sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            className='rounded-pill font-sans text-sm h-10 px-5 font-semibold bg-transparent hover:bg-slate-100'
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            variant='brand'
            className='rounded-pill font-sans text-sm h-10 gap-2 px-5 font-semibold brightness-90 hover:brightness-90'
            onClick={handleSubmit}
            disabled={isSubmitDisabled || isLoading}
          >
            {isLoading ? (
              <>
                <Icon name='refresh-cw' className='size-4 animate-spin' />
                Enviando...
              </>
            ) : (
              <>
                <Icon name='check' className='size-4' />
                Solicitar exceção
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}