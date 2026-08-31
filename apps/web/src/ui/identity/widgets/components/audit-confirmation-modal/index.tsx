import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

type AuditConfirmationModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (justification?: string) => void
  isDuplicityConflict?: boolean
  isPending?: boolean
}

export function AuditConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDuplicityConflict = false,
  isPending = false,
}: AuditConfirmationModalProps) {
  const [justification, setJustification] = useState('')

  const handleConfirm = () => {
    onConfirm(isDuplicityConflict ? justification : undefined)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px] p-0 overflow-hidden sm:rounded-3xl border-0 shadow-2xl'>
        <DialogHeader className='pt-10 px-6 pb-2'>
          <DialogTitle className='flex flex-col items-center gap-4 text-center'>
            <div className='flex size-14 items-center justify-center rounded-full shadow-sm ring-4 ring-offset-2 ring-transparent transition-all bg-amber-100 ring-amber-50'>
              <Icon name={isDuplicityConflict ? 'triangle-alert' : 'shield-alert'} className='size-7 text-amber-500' />
            </div>
            <span className='text-xl tracking-tight'>
              Confirmar Alterações
            </span>
          </DialogTitle>
          <DialogDescription className='text-center px-4 pt-1'>
            {isDuplicityConflict
              ? 'Este documento já está cadastrado para outra pessoa no sistema.'
              : 'As mudanças que você está fazendo serão registradas em auditoria imutável.'}
          </DialogDescription>
        </DialogHeader>

        {isDuplicityConflict && (
          <div className='flex flex-col gap-4 px-8 py-2'>
            <div className='bg-red-50 text-red-900 border border-red-200 rounded-xl p-4 shadow-sm'>
              <div className='flex items-center gap-2 text-sm font-semibold mb-1 justify-center'>
                <Icon name='triangle-alert' className='size-4' />
                Documento Duplicado
              </div>
              <p className='text-xs text-red-800 leading-relaxed text-center font-medium'>
                Apenas perfis autorizados (Administrador ou Supervisor) podem forçar o salvamento de um documento duplicado mediante justificativa.
              </p>
            </div>
            <div className='space-y-2.5 mt-2'>
              <Label htmlFor='justification' className='text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1'>
                Justificativa Obrigatória
              </Label>
              <Input
                id='justification'
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder='Por que deseja salvar este documento duplicado?'
                className='rounded-xl shadow-sm border-gray-200 transition-all h-11'
                autoFocus
              />
            </div>
          </div>
        )}

        <DialogFooter className='px-8 pb-8 pt-6 sm:justify-center flex-col-reverse sm:flex-row gap-3 border-t border-gray-100/50 mt-2 bg-gray-50/30'>
          <Button 
            variant='outline' 
            onClick={onClose} 
            disabled={isPending} 
            className='rounded-full sm:w-1/2 h-11 font-medium border-gray-200 shadow-sm'
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isPending || (isDuplicityConflict && justification.trim().length < 5)}
            className='rounded-full sm:w-1/2 h-11 font-medium shadow-md'
          >
            {isPending ? 'Confirmando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
