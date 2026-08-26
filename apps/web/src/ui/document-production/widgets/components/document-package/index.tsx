import type { ReactNode } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { DocumentPackageList } from './document-package-list'
import type { DocumentPackageAction, DocumentPackageItem } from './types'

export type DocumentPackageProps = {
  title: string
  description: string
  summary: string
  items: readonly DocumentPackageItem[]
  selectionLabel?: string
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  emptyState?: ReactNode
  loadingState?: ReactNode
  errorState?: ReactNode
  isReadOnly?: boolean
  isConfirmed?: boolean
  isConfirming?: boolean
  isReopening?: boolean
  isConfirmationEligible?: boolean
  onSelect?: () => void
  onConfirm?: () => Promise<unknown>
  onReopen?: () => Promise<unknown>
  onRetry?: () => Promise<unknown>
  onGenerateDocument?: (documentId: string) => Promise<unknown>
  onCancelDocumentGeneration?: (documentId: string) => Promise<unknown>
  isCancellingDocument?: boolean
  onRefreshDocument?: () => Promise<unknown>
  renderAction?: (action: DocumentPackageAction, item: DocumentPackageItem) => ReactNode
}

export const DocumentPackage = ({
  title,
  description,
  summary,
  items,
  selectionLabel = 'Selecionar documentos',
  isLoading = false,
  isError = false,
  errorMessage,
  emptyState,
  loadingState,
  errorState,
  isReadOnly = false,
  isConfirmed = false,
  isConfirming = false,
  isReopening = false,
  isConfirmationEligible = false,
  onSelect,
  onConfirm,
  onReopen,
  onRetry,
  onGenerateDocument,
  onCancelDocumentGeneration,
  isCancellingDocument,
  onRefreshDocument,
  renderAction,
}: DocumentPackageProps) => {
  const isConfirmationDisabled =
    isReadOnly || isConfirming || !isConfirmationEligible || items.length === 0

  return (
    <section className='rounded-xl border border-border bg-card px-4 py-4 shadow-sm sm:px-5'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div className='min-w-0 space-y-1'>
          <h2 className='font-serif text-xl font-semibold'>{title}</h2>
          <p className='max-w-2xl text-xs leading-5 text-muted-foreground'>
            {description}
          </p>
        </div>
        <div className='flex flex-wrap justify-end gap-3'>
          {onSelect && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onSelect}
              disabled={isReadOnly}
              title={isReadOnly ? 'Pacote em modo somente leitura.' : undefined}
            >
              <Icon name='list-plus' />
              {selectionLabel}
            </Button>
          )}
          {isConfirmed && onReopen ? (
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={isReopening}
              onClick={() => void onReopen()}
            >
              <Icon name='pencil' />
              {isReopening ? 'Reabrindo...' : 'Editar pacote'}
            </Button>
          ) : (
            onConfirm && (
              <Button
                type='button'
                size='sm'
                disabled={isConfirmationDisabled}
                onClick={() => void onConfirm()}
                title={
                  isReadOnly
                    ? 'Pacote em modo somente leitura.'
                    : 'Gere e revise todos os documentos para confirmar o pacote.'
                }
              >
                <Icon name='check' />
                {isConfirming ? 'Confirmando...' : 'Confirmar pacote'}
              </Button>
            )
          )}
        </div>
      </header>

      {errorMessage && (
        <p
          className='mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
          role='alert'
        >
          {errorMessage}
        </p>
      )}

      <div className='mt-4 flex items-center justify-between border-b border-border pb-2 text-[0.6875rem] text-muted-foreground'>
        <span>{summary}</span>
        <span>Produção documental</span>
      </div>

      <div className='pt-1'>
        {isLoading ? (
          loadingState
        ) : isError ? (
          (errorState ?? (
            <div role='alert' className='p-4 text-sm text-destructive'>
              Não foi possível carregar o pacote.
              {onRetry && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => void onRetry()}
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          ))
        ) : items.length === 0 ? (
          emptyState
        ) : (
          <DocumentPackageList
            items={items}
            onGenerateDocument={onGenerateDocument}
            onCancelDocumentGeneration={onCancelDocumentGeneration}
            isCancellingDocument={isCancellingDocument}
            onRefreshDocument={onRefreshDocument}
            isReadOnly={isReadOnly}
            renderAction={renderAction}
          />
        )}
      </div>
    </section>
  )
}

export type {
  DocumentPackageAction,
  DocumentPackageItem,
  DocumentPackageStatus,
} from './types'
export { DocumentPackageList } from './document-package-list'
export { DocumentPackageRow } from './document-package-row'
export {
  type DocumentPackageSourceItem,
  type DocumentPackageSourceVersion,
  type DocumentPackageViewModel,
  useDocumentPackage,
} from './use-document-package'
