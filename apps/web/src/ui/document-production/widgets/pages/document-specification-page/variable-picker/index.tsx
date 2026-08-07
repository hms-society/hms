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
import { RemoveVariableDialog } from './remove-variable-dialog'
import { useVariablePicker, type VariablePickerProps } from './use-variable-picker'

export type { VariablePickerProps } from './use-variable-picker'

export const VariablePicker = (props: VariablePickerProps) => {
  const variablePicker = useVariablePicker(props)

  return (
    <aside
      className='overflow-hidden rounded-xl border bg-card'
      aria-label='Variáveis do template'
    >
      <header className='flex items-start justify-between gap-3 border-b px-4 py-3'>
        <div>
          <h2 className='text-base font-semibold'>Variáveis</h2>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Clique para inserir no texto.
          </p>
        </div>
        <span className='shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground'>
          {variablePicker.availableCount} disponíveis
        </span>
      </header>
      <div className='space-y-3 p-3'>
        <Input
          aria-label='Buscar variáveis'
          placeholder='Buscar variável...'
          value={variablePicker.search}
          onChange={(event) => variablePicker.setSearch(event.target.value)}
        />
        <Button
          type='button'
          variant='secondary'
          size='sm'
          className='w-full rounded-full text-primary'
          aria-label='Criar variável personalizada'
          onClick={variablePicker.handleAdd}
        >
          <Icon name='plus' className='size-4' />
          Criar variável
        </Button>
        <div className='max-h-[30rem] space-y-1 overflow-y-auto'>
          {variablePicker.items.map((variable) => (
            <div
              className='grid grid-cols-[minmax(0,1fr)_2rem_2rem_2rem] items-center gap-1 rounded-lg hover:bg-secondary/60'
              key={variable.technicalName}
            >
              <fieldset
                aria-label={`Variável ${variable.label}, arraste para o editor`}
                className='flex min-h-14 min-w-0 cursor-grab items-center rounded-lg px-2 py-2 text-left active:cursor-grabbing'
                draggable
                onDragStart={(event) =>
                  variablePicker.handleVariableDragStart(event, variable.technicalName)
                }
              >
                <span className='flex min-w-0 items-center gap-2'>
                  <span className='flex size-7 shrink-0 items-center justify-center rounded-md bg-highlight text-[10px] font-semibold text-highlight-foreground'>
                    {'{}'}
                  </span>
                  <span className='min-w-0'>
                    <strong className='block truncate text-xs'>{variable.label}</strong>
                    <small className='block truncate text-[10px] text-muted-foreground'>
                      {`{{${variable.technicalName}}}`}
                    </small>
                  </span>
                </span>
              </fieldset>
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                className='size-8 justify-self-center text-primary hover:bg-secondary'
                aria-label={`Inserir variável ${variable.label}`}
                title='Inserir variável'
                onClick={() => variablePicker.onInsert(variable.technicalName)}
              >
                <Icon name='plus' className='size-4' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                className='size-8 justify-self-center text-muted-foreground hover:bg-secondary hover:text-primary'
                aria-label={`Editar variável ${variable.label}`}
                title='Editar variável'
                onClick={() => variablePicker.handleEdit(variable)}
              >
                <Icon name='pencil' className='size-3.5' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                className='size-8 justify-self-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                aria-label={`Remover variável ${variable.label}`}
                title='Remover variável'
                onClick={() => variablePicker.handleRemoveRequest(variable)}
              >
                <Icon name='trash-2' className='size-3.5' />
              </Button>
            </div>
          ))}
          {variablePicker.items.length === 0 && (
            <p className='py-4 text-center text-sm text-muted-foreground'>
              Nenhuma variável encontrada.
            </p>
          )}
        </div>
      </div>
      <Dialog
        open={variablePicker.open}
        onOpenChange={variablePicker.handleDialogOpenChange}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {variablePicker.editingTechnicalName
                ? 'Editar variável'
                : 'Criar variável personalizada'}
            </DialogTitle>
            <DialogDescription>
              {variablePicker.editingTechnicalName
                ? 'Atualize o rótulo e a descrição. O nome técnico é regenerado automaticamente e pode ser ajustado.'
                : 'A variável ficará disponível apenas neste modelo e será salva com o template.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='variable-label'>Nome do rótulo (o que o advogado vê)</Label>
              <Input
                id='variable-label'
                value={variablePicker.draft.label}
                onChange={(event) => variablePicker.handleLabelChange(event.target.value)}
                aria-invalid={Boolean(variablePicker.errors.label)}
              />
              {variablePicker.errors.label && (
                <p className='text-xs text-destructive'>{variablePicker.errors.label}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='variable-technical-name'>
                Nome técnico (usado no template) *
              </Label>
              <p className='text-xs text-muted-foreground'>
                Gerado automaticamente a partir do rótulo, você pode alterar.
              </p>
              <Input
                id='variable-technical-name'
                value={`{{${variablePicker.draft.technicalName}}}`}
                onChange={(event) =>
                  variablePicker.handleTechnicalNameChange(event.target.value)
                }
                aria-invalid={Boolean(variablePicker.errors.technicalName)}
              />
              {variablePicker.errors.technicalName && (
                <p className='text-xs text-destructive'>
                  {variablePicker.errors.technicalName}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='variable-description'>Descrição</Label>
              <p className='text-xs text-muted-foreground'>
                Dica para a IA injetar o conteúdo corretamente (opcional)
              </p>
              <Textarea
                id='variable-description'
                value={variablePicker.draft.description}
                onChange={(event) =>
                  variablePicker.handleDescriptionChange(event.target.value)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={variablePicker.handleCancel}>
              Cancelar
            </Button>
            <Button type='button' onClick={variablePicker.submitVariable}>
              {variablePicker.editingTechnicalName
                ? 'Salvar alterações'
                : 'Adicionar variável'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <RemoveVariableDialog
        variable={variablePicker.removingVariable}
        open={Boolean(variablePicker.removingVariable)}
        onOpenChange={variablePicker.handleRemoveDialogChange}
        onConfirm={variablePicker.handleRemoveConfirm}
      />
    </aside>
  )
}
