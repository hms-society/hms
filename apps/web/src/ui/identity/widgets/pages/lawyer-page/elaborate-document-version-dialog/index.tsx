import { useEffect, useState } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Textarea } from '@/ui/shadcn/textarea'

type VersionOption = {
  id: string
  versionNumber: number
  status: string
  createdAt: string
}

type Props = {
  open: boolean
  versions: VersionOption[]
  currentVersionId: string
  isGenerating: boolean
  error?: string
  onOpenChange: (open: boolean) => void
  onStartManual: (sourceVersionId: string) => void
  onGenerateWithAi: (sourceVersionId: string, instructions: string) => void
}

export function ElaborateDocumentVersionDialog({
  open,
  versions,
  currentVersionId,
  isGenerating,
  error,
  onOpenChange,
  onStartManual,
  onGenerateWithAi,
}: Props) {
  const [sourceVersionId, setSourceVersionId] = useState(currentVersionId)
  const [instructions, setInstructions] = useState('')
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  useEffect(() => {
    if (!open) return
    setSourceVersionId(currentVersionId)
    setInstructions('')
    setMode('manual')
  }, [currentVersionId, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Elaborar nova versão</DialogTitle>
          <DialogDescription>
            Escolha uma versão-base e como deseja preparar a próxima versão. A atual
            permanecerá preservada no histórico.
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={isGenerating} className='min-w-0 space-y-4'>
          <legend className='mb-2 text-sm font-medium'>Versão-base</legend>
          <div className='max-h-48 space-y-2 overflow-y-auto'>
            {[...versions].reverse().map((version) => (
              <label
                key={version.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${sourceVersionId === version.id ? 'border-primary bg-highlight/50' : ''}`}
              >
                <input
                  type='radio'
                  name='source-document-version'
                  value={version.id}
                  checked={sourceVersionId === version.id}
                  onChange={() => setSourceVersionId(version.id)}
                />
                <span className='min-w-0 flex-1'>
                  <span className='block font-medium'>
                    Versão v{version.versionNumber}
                  </span>
                  <span className='block text-xs text-muted-foreground'>
                    {new Date(version.createdAt).toLocaleString('pt-BR')}
                  </span>
                </span>
                {version.id === currentVersionId ? <Badge>Atual</Badge> : null}
              </label>
            ))}
          </div>
          <div className='grid gap-2 sm:grid-cols-2'>
            <button
              type='button'
              aria-pressed={mode === 'manual'}
              className={`rounded-md border p-3 text-left ${mode === 'manual' ? 'border-primary bg-highlight/50' : ''}`}
              onClick={() => setMode('manual')}
            >
              <span className='flex items-center gap-2 font-medium'>
                <Icon name='pencil' /> Edição manual
              </span>
              <span className='mt-1 block text-xs text-muted-foreground'>
                Editar o conteúdo e salvar como nova versão.
              </span>
            </button>
            <button
              type='button'
              aria-pressed={mode === 'ai'}
              className={`rounded-md border p-3 text-left ${mode === 'ai' ? 'border-primary bg-highlight/50' : ''}`}
              onClick={() => setMode('ai')}
            >
              <span className='flex items-center gap-2 font-medium'>
                <Icon name='sparkles' /> Geração por IA
              </span>
              <span className='mt-1 block text-xs text-muted-foreground'>
                A IA propõe uma nova versão para revisão humana.
              </span>
            </button>
          </div>
          {mode === 'ai' ? (
            <label
              className='block space-y-2 text-sm font-medium'
              htmlFor='version-instructions'
            >
              Instruções para a IA
              <Textarea
                id='version-instructions'
                value={instructions}
                maxLength={4000}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder='Ex.: mantenha o texto anterior e acrescente um pedido subsidiário de reafirmação da DER.'
              />
              <span className='text-xs font-normal text-muted-foreground'>
                {instructions.length}/4000
              </span>
            </label>
          ) : null}
          {error ? (
            <p role='alert' className='text-sm text-destructive'>
              {error}
            </p>
          ) : null}
        </fieldset>
        <DialogFooter>
          <Button
            variant='outline'
            disabled={isGenerating}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          {mode === 'manual' ? (
            <Button
              disabled={!sourceVersionId}
              onClick={() => onStartManual(sourceVersionId)}
            >
              <Icon name='pencil' /> Abrir no editor
            </Button>
          ) : (
            <Button
              disabled={!sourceVersionId || !instructions.trim() || isGenerating}
              onClick={() => onGenerateWithAi(sourceVersionId, instructions.trim())}
            >
              {isGenerating ? (
                <Icon name='refresh-cw' className='animate-spin' />
              ) : (
                <Icon name='sparkles' />
              )}
              {isGenerating ? 'Enviando…' : 'Gerar nova versão'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
