import { Icon } from '@/ui/shared/widgets/components/icon'
import type { DynamicFormSelectorProps } from './types'
import { useDynamicFormSelector } from './use-dynamic-form-selector'

export const DynamicFormSelector = (props: DynamicFormSelectorProps) => {
  const { context, handleOpenSelectModal, isDisabled } = useDynamicFormSelector(props)

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between gap-4'>
        <span className='text-base font-medium text-foreground'>Ficha</span>
        <span className='text-xs text-muted-foreground'>Pesquise pelo nome da ficha</span>
      </div>
      <button
        type='button'
        onClick={handleOpenSelectModal}
        disabled={isDisabled}
        className='flex min-h-16 w-full items-center justify-between gap-4 rounded-xl border border-input bg-transparent px-3 py-2 text-left transition-colors hover:bg-muted/30 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-100'
      >
        <span className='flex min-w-0 items-center gap-3'>
          <Icon name='file-text' className='size-5 shrink-0 text-primary' />
          <span className='min-w-0'>
            <span className='block truncate text-sm font-semibold text-foreground'>
              {props.selectedFormName}
            </span>
            {context && (
              <span className='mt-0.5 block truncate text-xs text-muted-foreground'>
                {context}
              </span>
            )}
          </span>
        </span>
        <Icon name='chevron-down' className='size-5 shrink-0 text-muted-foreground' />
      </button>
    </div>
  )
}

export type { DynamicFormSelectorProps } from './types'
