import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { Check, Search, Scale, Tags } from 'lucide-react'

import {
  useLawyerSelectorDialog,
  type LawyerOption,
  type LawyerSelectorDialogProps,
} from './use-lawyer-selector-dialog'

export type { LawyerOption, LawyerSelectorDialogProps }

export const LawyerSelectorDialog = (props: LawyerSelectorDialogProps) => {
  const {
    area,
    areas,
    filteredLawyers,
    handleAreaChange,
    handleClearFilters,
    handleConfirm,
    handleLawyerSelect,
    handleLoadMore,
    handleSearchChange,
    handleTopicChange,
    handleRetry,
    isError,
    isFetchingNextPage,
    isLoading,
    hasNextPage,
    search,
    selectedLawyerOption,
    topic,
    topics,
  } = useLawyerSelectorDialog(props)

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[620px] [&>[data-slot=dialog-close]]:top-5 [&>[data-slot=dialog-close]]:right-5 [&>[data-slot=dialog-close]]:size-8 [&>[data-slot=dialog-close]]:rounded-full [&>[data-slot=dialog-close]]:bg-secondary'>
        <DialogHeader className='gap-1 border-b border-border px-7 pt-6 pb-5 pr-16'>
          <DialogTitle className='font-serif text-[22px] font-bold text-brand'>
            Selecionar advogado
          </DialogTitle>
          <DialogDescription className='text-[11px] leading-relaxed'>
            Busque por nome ou refine pelos campos jurídicos.
          </DialogDescription>
        </DialogHeader>

        <div className='min-h-0 overflow-y-auto px-7 py-6'>
          <div className='relative'>
            <Search className='pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder='Buscar advogado por nome'
              className='h-11 rounded-lg pl-10 text-sm'
              aria-label='Buscar advogado por nome'
            />
          </div>

          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <label
                className='text-xs font-semibold text-foreground'
                htmlFor='lawyer-area-filter'
              >
                Área jurídica
              </label>
              <Select value={area} onValueChange={handleAreaChange}>
                <SelectTrigger id='lawyer-area-filter' className='h-10 w-full'>
                  <div className='flex min-w-0 items-center gap-2'>
                    <Scale className='size-4 shrink-0 text-brand' />
                    <SelectValue placeholder='Todas as áreas' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas as áreas</SelectItem>
                  {areas.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <label
                className='text-xs font-semibold text-foreground'
                htmlFor='lawyer-topic-filter'
              >
                Tema jurídico
              </label>
              <Select value={topic} onValueChange={handleTopicChange}>
                <SelectTrigger id='lawyer-topic-filter' className='h-10 w-full'>
                  <div className='flex min-w-0 items-center gap-2'>
                    <Tags className='size-4 shrink-0 text-brand' />
                    <SelectValue placeholder='Todos os temas' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos os temas</SelectItem>
                  {topics.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='mt-5 flex items-center justify-between gap-3'>
            <span className='text-xs font-semibold text-muted-foreground'>
              {filteredLawyers.length} advogados encontrados
            </span>
            <button
              type='button'
              onClick={handleClearFilters}
              className='text-xs font-bold text-brand hover:underline'
            >
              Limpar
            </button>
          </div>

          <div className='mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1'>
            {isLoading && (
              <div className='rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground'>
                Carregando advogados...
              </div>
            )}
            {isError && (
              <div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6 text-center'>
                <p className='text-sm font-medium text-destructive'>
                  Não foi possível carregar os advogados.
                </p>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-3 rounded-pill'
                  onClick={handleRetry}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {!isLoading && !isError && filteredLawyers.length === 0 && (
              <div className='rounded-xl border border-dashed border-border px-4 py-8 text-center'>
                <p className='text-sm font-medium text-foreground'>
                  Nenhum advogado encontrado
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Tente ajustar sua busca ou limpar os filtros.
                </p>
              </div>
            )}
            {filteredLawyers.map((lawyer) => {
              const isSelected = lawyer.value === selectedLawyerOption?.value

              return (
                <button
                  type='button'
                  key={lawyer.value}
                  onClick={() => handleLawyerSelect(lawyer.value)}
                  className={`flex min-h-20 w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${isSelected ? 'border-primary bg-secondary' : 'border-border bg-card hover:bg-muted/50'}`}
                  aria-pressed={isSelected}
                >
                  <Avatar className={`size-10 ${lawyer.avatarClassName}`}>
                    <AvatarFallback
                      className={`text-xs font-bold ${lawyer.avatarClassName}`}
                    >
                      {lawyer.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-bold text-foreground'>
                      {lawyer.label}
                    </span>
                    <span className='mt-1 block text-xs font-bold text-brand'>
                      {lawyer.area}
                    </span>
                    <span className='mt-1 block truncate text-xs text-muted-foreground'>
                      {lawyer.topics.join(' · ') || 'Temas não informados'}
                    </span>
                  </span>
                  {isSelected && (
                    <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                      <Check className='size-4' />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {hasNextPage && (
            <Button
              type='button'
              variant='outline'
              className='mt-3 w-full rounded-pill'
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
            </Button>
          )}

          <p className='mt-4 flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Icon name='info' className='size-3.5 shrink-0' />
            Os horários serão recalculados para o advogado selecionado.
          </p>
        </div>

        <DialogFooter className='rounded-none bg-card px-7 pt-5 pb-7 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-10 rounded-pill border-primary px-6 text-sm text-primary'
            onClick={() => props.onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type='button'
            size='sm'
            className='h-10 rounded-pill px-6 text-sm'
            disabled={!selectedLawyerOption}
            onClick={handleConfirm}
          >
            Selecionar advogado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
