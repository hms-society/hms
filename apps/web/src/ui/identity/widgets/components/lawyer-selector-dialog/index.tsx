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

import { Check, Search, Scale, Tags, X } from 'lucide-react'

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
      <DialogContent className='max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl'>
        <DialogHeader className='border-b border-border pb-4'>
          <DialogTitle className='font-serif text-2xl'>Selecionar advogado</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>

        <div className='relative'>
          <Search
            className='absolute top-3 left-3 size-4 text-muted-foreground'
            aria-hidden='true'
          />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder='Buscar advogado por nome'
            className='pl-9 pr-9'
            aria-label='Buscar advogado por nome'
          />
          {search ? (
            <Button
              type='button'
              variant='ghost'
              size='icon-xs'
              className='absolute top-1.5 right-1'
              onClick={() => handleSearchChange('')}
              aria-label='Limpar busca'
            >
              <X aria-hidden='true' />
            </Button>
          ) : null}
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <label
              className='text-xs font-semibold text-foreground'
              htmlFor='lawyer-area-filter'
            >
              Área jurídica
            </label>
            <Select value={area} onValueChange={handleAreaChange}>
              <SelectTrigger id='lawyer-area-filter' className='w-full'>
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
              <SelectTrigger id='lawyer-topic-filter' className='w-full'>
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

        <div className='flex items-center justify-between gap-3'>
          <span className='text-xs text-muted-foreground'>
            {filteredLawyers.length} advogados encontrados
          </span>
          <button
            type='button'
            onClick={handleClearFilters}
            className='text-xs text-muted-foreground underline-offset-4 hover:underline'
          >
            Limpar filtros
          </button>
        </div>

        {isLoading && (
          <p role='status' className='py-4 text-center text-sm text-muted-foreground'>
            Carregando advogados...
          </p>
        )}
        {isError && (
          <div role='alert' className='flex flex-col items-center gap-3 py-4 text-center'>
            <p className='text-sm text-destructive'>
              Não foi possível carregar os advogados.
            </p>
            <Button type='button' variant='outline' size='sm' onClick={handleRetry}>
              Tentar novamente
            </Button>
          </div>
        )}
        {!isLoading && !isError && filteredLawyers.length === 0 && (
          <p className='py-4 text-center text-sm text-muted-foreground'>
            Nenhum advogado encontrado. Tente ajustar sua busca ou limpar os filtros.
          </p>
        )}
        {!isLoading && !isError && filteredLawyers.length > 0 && (
          <div
            role='listbox'
            aria-label='Advogados disponíveis'
            className='flex max-h-72 flex-col gap-2 overflow-y-auto'
          >
            {filteredLawyers.map((lawyer) => {
              const isSelected = lawyer.value === selectedLawyerOption?.value

              return (
                <button
                  type='button'
                  key={lawyer.value}
                  role='option'
                  aria-selected={isSelected}
                  onClick={() => handleLawyerSelect(lawyer.value)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring ${isSelected ? 'border-primary bg-highlight/60' : 'border-border bg-card hover:bg-muted/50'}`}
                >
                  <Avatar className={`size-9 ${lawyer.avatarClassName}`}>
                    <AvatarFallback
                      className={`text-xs font-semibold ${lawyer.avatarClassName}`}
                    >
                      {lawyer.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-semibold text-foreground'>
                      {lawyer.label}
                    </span>
                    <span className='flex min-w-0 items-center gap-1 text-xs text-muted-foreground'>
                      <Scale className='size-3 shrink-0' aria-hidden='true' />
                      <span className='truncate'>
                        {lawyer.area} ·{' '}
                        {lawyer.topics.join(' · ') || 'Temas não informados'}
                      </span>
                    </span>
                  </span>
                  {isSelected && (
                    <Check
                      className='size-5 shrink-0 text-primary'
                      aria-label='Selecionado'
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {hasNextPage && (
          <Button
            type='button'
            variant='outline'
            className='w-full'
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
          </Button>
        )}

        {props.helperText ? (
          <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <Icon name='info' className='size-3.5 shrink-0' />
            {props.helperText}
          </p>
        ) : null}

        <DialogFooter className='sm:justify-between'>
          <Button
            type='button'
            variant='outline'
            onClick={() => props.onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type='button' disabled={!selectedLawyerOption} onClick={handleConfirm}>
            Selecionar advogado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
