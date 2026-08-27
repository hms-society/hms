import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/ui/shadcn/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'

import type { ClassificacaoAcesso } from './document-access-badge'

interface ChangeAccessDialogProps {
  isOpen: boolean
  onClose: () => void
  documentTitle: string
  currentClassification: ClassificacaoAcesso
  onConfirm: (newClassification: ClassificacaoAcesso) => Promise<void>
}

export function ChangeAccessDialog({
  isOpen,
  onClose,
  documentTitle,
  currentClassification,
  onConfirm,
}: ChangeAccessDialogProps) {
  const [selected, setSelected] = useState<ClassificacaoAcesso>(
    currentClassification || 'INTERNO',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      setError(null)
      await onConfirm(selected)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocorreu um erro ao alterar o acesso.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Alterar Nível de Acesso</DialogTitle>
          <DialogDescription>
            Defina quem poderá acessar o documento <strong>{documentTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          {error && (
            <div className='p-3 text-sm text-destructive bg-destructive/10 rounded-md'>
              {error}
            </div>
          )}
          <label className='text-sm font-medium'>Nova Classificação</label>
          <Select
            value={selected}
            onValueChange={(value) => setSelected(value as ClassificacaoAcesso)}
          >
            <SelectTrigger className='w-full rounded-full'>
              <SelectValue placeholder='Selecione o acesso...' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='INTERNO'>Interno (Padrão)</SelectItem>
              <SelectItem value='CLIENTE'>Cliente</SelectItem>
              <SelectItem value='RESTRITO'>Restrito</SelectItem>
              <SelectItem value='CONFIDENCIAL'>Confidencial</SelectItem>
              <SelectItem value='PARCEIRO_LIBERADO'>Parceiro Liberado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            className='rounded-full'
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            className='rounded-full'
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Confirmar Alteração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
