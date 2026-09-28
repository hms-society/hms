import { Check, Search, UserRound, X } from 'lucide-react'

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
import { useClientFilterDialog } from './use-client-filter-dialog'

export type ClientFilterDialogProps = {
  open: boolean
  selectedClientId?: string
  onOpenChange: (open: boolean) => void
  onApply: (clientId?: string) => void
}

export function ClientFilterDialog({
  open,
  selectedClientId,
  onOpenChange,
  onApply,
}: ClientFilterDialogProps) {
  const controller = useClientFilterDialog(open, selectedClientId, onApply)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl'>
        <DialogHeader className='border-b border-border pb-4'>
          <DialogTitle className='font-serif text-2xl'>Selecionar cliente</DialogTitle>
          <DialogDescription>
            Busque pelo nome e selecione um cliente para filtrar a agenda.
          </DialogDescription>
        </DialogHeader>
        <div className='relative'>
          <Search
            className='absolute top-3 left-3 size-4 text-muted-foreground'
            aria-hidden='true'
          />
          <Input
            value={controller.search}
            onChange={(event) => controller.setSearch(event.target.value)}
            placeholder='Buscar cliente por nome'
            aria-label='Buscar cliente por nome'
            className='pl-9 pr-9'
          />
          {controller.search ? (
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              className='absolute top-1.5 right-1'
              onClick={controller.clearSearch}
              aria-label='Limpar busca'
            >
              <X aria-hidden='true' />
            </Button>
          ) : null}
        </div>
        <p className='text-xs text-muted-foreground'>
          {controller.isLoading
            ? 'Buscando clientes…'
            : `${controller.options.length} clientes encontrados`}
        </p>
        {controller.isError ? (
          <p className='text-sm text-destructive' role='alert'>
            Não foi possível carregar os clientes. Tente novamente.
          </p>
        ) : null}
        <div
          className='flex max-h-72 flex-col gap-2 overflow-y-auto'
          role='listbox'
          aria-label='Clientes disponíveis'
        >
          {controller.options.map((option) => {
            const isSelected = controller.draftClientId === option.id
            return (
              <button
                key={option.id}
                type='button'
                role='option'
                aria-selected={isSelected}
                onClick={() => controller.setDraftClientId(option.id)}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left focus-visible:outline-2 focus-visible:outline-ring ${isSelected ? 'border-primary bg-highlight/60' : 'border-border bg-card hover:bg-muted/50'}`}
              >
                <span className='flex size-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground'>
                  {option.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-semibold'>
                    {option.name}
                  </span>
                  <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                    <UserRound className='size-3' aria-hidden='true' />
                    Cliente autorizado
                  </span>
                </span>
                {isSelected ? (
                  <Check className='size-5 text-primary' aria-label='Selecionado' />
                ) : null}
              </button>
            )
          })}
          {!controller.isLoading &&
          !controller.isError &&
          controller.options.length === 0 ? (
            controller.isScanLimitReached ? (
              <div className='space-y-2 py-4 text-center text-sm text-muted-foreground'>
                <p>A busca foi limitada para preservar o desempenho.</p>
                <Button type='button' variant='outline' onClick={controller.loadMore}>
                  Continuar busca
                </Button>
              </div>
            ) : (
              <p className='py-6 text-center text-sm text-muted-foreground'>
                Nenhum cliente encontrado.
              </p>
            )
          ) : null}
          {!controller.isLoading &&
          controller.hasNextPage &&
          controller.options.length > 0 ? (
            <Button type='button' variant='outline' onClick={controller.loadMore}>
              Carregar mais clientes
            </Button>
          ) : null}
        </div>
        <DialogFooter className='sm:justify-between'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type='button'
            onClick={() => {
              controller.apply()
              onOpenChange(false)
            }}
          >
            Aplicar filtro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
