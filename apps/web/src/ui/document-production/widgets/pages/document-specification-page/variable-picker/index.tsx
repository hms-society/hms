import type { DocumentTemplateVariable } from '@hms/core/document-production/domain/structures'
import { SYSTEM_DOCUMENT_TEMPLATE_VARIABLES } from '@hms/core/document-production/domain/structures'
import { documentTemplateVariableSchema } from '@hms/validation/document-production'
import { useMemo, useState } from 'react'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type VariablePickerProps = {
  variables: readonly DocumentTemplateVariable[]
  onInsert: (name: string) => void
  onAdd: (variable: DocumentTemplateVariable) => void
}

export const VariablePicker = ({ variables, onInsert, onAdd }: VariablePickerProps) => {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ label: '', technicalName: '', description: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const items = useMemo(
    () =>
      [...SYSTEM_DOCUMENT_TEMPLATE_VARIABLES, ...variables].filter((variable) =>
        [variable.label, variable.technicalName, variable.description]
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [search, variables],
  )
  function suggestTechnicalName(label: string) {
    return label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
  }
  function handleAdd() {
    setDraft({ label: '', technicalName: '', description: '' })
    setErrors({})
    setOpen(true)
  }
  function handleLabelChange(label: string) {
    setDraft((current) => ({
      ...current,
      label,
      technicalName: current.technicalName || suggestTechnicalName(label),
    }))
  }
  function submitVariable() {
    const parsed = documentTemplateVariableSchema.safeParse(draft)
    const nextErrors: Record<string, string> = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        nextErrors[String(issue.path[0] ?? 'label')] = issue.message
      }
    }
    const technicalName = draft.technicalName.trim()
    if (
      SYSTEM_DOCUMENT_TEMPLATE_VARIABLES.some(
        (variable) => variable.technicalName === technicalName,
      )
    )
      nextErrors.technicalName = 'Esse nome é reservado para uma variável do sistema.'
    else if (variables.some((variable) => variable.technicalName === technicalName))
      nextErrors.technicalName = 'Esse nome técnico já foi usado neste modelo.'
    setErrors(nextErrors)
    if (!parsed.success || Object.keys(nextErrors).length > 0) return
    onAdd(parsed.data)
    setOpen(false)
  }
  return (
    <aside
      className='space-y-3 rounded-xl border bg-card p-4'
      aria-label='Variáveis do template'
    >
      <div>
        <h2 className='font-serif text-lg font-semibold'>Variáveis</h2>
        <p className='text-xs text-muted-foreground'>
          Insira campos dinâmicos no cursor do editor.
        </p>
      </div>
      <Input
        aria-label='Buscar variáveis'
        placeholder='Buscar por nome ou descrição'
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className='max-h-72 overflow-y-auto rounded-lg border bg-muted/10'>
        {items.map((variable) => (
          <Button
            type='button'
            variant='ghost'
            className='h-auto min-h-14 w-full justify-between rounded-none border-b px-3 py-2 text-left last:border-b-0'
            key={variable.technicalName}
            onClick={() => onInsert(variable.technicalName)}
          >
            <span>
              <strong className='block'>{variable.label}</strong>
              <small className='text-muted-foreground'>
                {`{{${variable.technicalName}}}`} · {variable.description}
              </small>
            </span>
            <Icon
              name='chevron-right'
              className='ml-3 h-4 w-4 shrink-0 text-muted-foreground'
            />
          </Button>
        ))}
        {items.length === 0 && (
          <p className='py-4 text-center text-sm text-muted-foreground'>
            Nenhuma variável encontrada.
          </p>
        )}
      </div>
      <Button type='button' variant='outline' className='w-full' onClick={handleAdd}>
        Criar variável personalizada
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar variável personalizada</DialogTitle>
            <DialogDescription>
              A variável ficará disponível apenas neste modelo e será salva com o
              template.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='variable-label'>Rótulo</Label>
              <Input
                id='variable-label'
                value={draft.label}
                onChange={(event) => handleLabelChange(event.target.value)}
                aria-invalid={Boolean(errors.label)}
              />
              {errors.label && <p className='text-xs text-destructive'>{errors.label}</p>}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='variable-technical-name'>Nome técnico</Label>
              <Input
                id='variable-technical-name'
                value={draft.technicalName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    technicalName: event.target.value,
                  }))
                }
                aria-invalid={Boolean(errors.technicalName)}
              />
              {errors.technicalName && (
                <p className='text-xs text-destructive'>{errors.technicalName}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='variable-description'>Descrição</Label>
              <Textarea
                id='variable-description'
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type='button' onClick={submitVariable}>
              Adicionar variável
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
