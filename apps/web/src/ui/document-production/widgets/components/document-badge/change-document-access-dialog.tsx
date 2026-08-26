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
  onConfirm: (newClassification: ClassificacaoAcesso, partnerId?: string) => void
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
  const [partnerId, setPartnerId] = useState('')

  const isPartner = selected === 'PARCEIRO_LIBERADO'
  const isSaveDisabled = isPartner && partnerId.trim() === ''

  const handleConfirm = () => {
    onConfirm(selected, isPartner ? partnerId : undefined)
    onClose()
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

          {isPartner && (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Identificador do Parceiro *</label>
              <Input
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                placeholder='Ex: CNPJ ou ID interno do parceiro'
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' className='rounded-full' onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className='rounded-full'
            onClick={handleConfirm}
            disabled={isSaveDisabled}
          >
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
