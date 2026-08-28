import { lazy, Suspense } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Label } from '@/ui/shadcn/label'
import { Skeleton } from '@/ui/shadcn/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { SignatureFieldsProgressDialog } from './signature-fields-progress-dialog'
import { RemoveAllSignatureFieldsDialog } from './remove-all-signature-fields-dialog'
import { useSignatureFieldsTab } from './use-signature-fields-tab'
import type { SignatureFieldsTabProps } from './use-signature-fields-tab'

export type { SignatureFieldsTabProps } from './use-signature-fields-tab'

const PdfDocument = lazy(async () => {
  const [{ Document, pdfjs }, { default: worker }] = await Promise.all([
    import('react-pdf'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  return { default: Document }
})

const PdfPage = lazy(async () => {
  const { Page } = await import('react-pdf')
  return { default: Page }
})

export const SignatureFieldsTab = (props: SignatureFieldsTabProps) => {
  const { configuration, expectedVersion, onOpenSignatories } = props
  const {
    addField,
    availableSignatories,
    canViewPreview,
    decreaseZoom,
    documentId,
    fields,
    getDocumentProgress,
    handleConfirmDocumentChange,
    handleDeleteField,
    handleDocumentChangeDialogOpenChange,
    handleFieldKeyDown,
    handleFieldPointerCancel,
    handleFieldPointerDown,
    handleFieldPointerMove,
    handleFieldPointerUp,
    handleRemoveFieldPointerDown,
    handleRemoveAllFields,
    handleRequestRemoveAllFields,
    handleResizeKeyDown,
    handleResizePointerDown,
    handleResizePointerMove,
    handleResizePointerUp,
    increaseZoom,
    isDirty,
    isDocumentChangeDialogOpen,
    isReadOnly,
    isRemoveAllFieldsDialogOpen,
    isReplacingSignatureFields,
    pageRef,
    pageWidth,
    persistLatest,
    preview,
    previewContent,
    previewId,
    previewUrl,
    replaceSignatureFieldsError,
    retrySignaturePreview,
    isRetryingSignaturePreview,
    selectedPage,
    selectedSignatoryId,
    selectDocument,
    setSelectedPage,
    setSelectedSignatoryId,
    setIsRemoveAllFieldsDialogOpen,
    viewerRef,
    zoom,
  } = useSignatureFieldsTab(props)

  const pdfViewerSkeleton = (
    <div
      role='status'
      aria-label='Carregando PDF'
      aria-busy='true'
      className='flex min-h-[34rem] items-start justify-center bg-muted/20 p-5 sm:min-h-[48rem] sm:p-8'
    >
      <div className='w-full max-w-2xl space-y-6 rounded-md border border-border bg-card p-6 shadow-sm sm:p-8'>
        <div className='flex items-center justify-between gap-4'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-8 w-24 rounded-full' />
        </div>
        <div className='space-y-3'>
          <Skeleton className='h-7 w-4/5' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-11/12' />
        </div>
        <div className='space-y-4 pt-4'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-11/12' />
          <Skeleton className='h-4 w-4/5' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-5/6' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-2/3' />
        </div>
        <div className='flex justify-end pt-8'>
          <Skeleton className='h-8 w-28' />
        </div>
      </div>
    </div>
  )

  return (
    <div className='space-y-5'>
      <section className='rounded-xl border border-border bg-muted/30 p-4 sm:p-5'>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex min-w-0 items-start gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <Icon name='pencil' className='size-5' />
            </span>
            <div>
              <p className='text-xs font-semibold tracking-[0.14em] text-primary uppercase'>
                Editor de campos
              </p>
              <h3 className='mt-1 font-serif text-lg font-semibold'>
                Posicione as assinaturas
              </h3>
              <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>
                Selecione o documento e o signatário para adicionar e ajustar campos no
                PDF.
              </p>
            </div>
          </div>
          <Badge variant={isDirty ? 'attention' : 'secondary'}>
            {isDirty ? 'Alterações pendentes' : 'Tudo salvo'}
          </Badge>
        </div>
      </section>

      <div className='grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]'>
        <aside className='flex h-fit flex-col gap-5 rounded-xl border border-border bg-card p-4'>
          <div className='space-y-4'>
            <div className='flex items-start gap-3'>
              <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <Icon name='file-text' className='size-4' />
              </span>
              <div>
                <h3 className='font-serif text-base font-semibold'>Documentos</h3>
                <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                  Selecione um documento para editar.
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='signature-fields-document'>Documento</Label>
              <Select value={documentId} onValueChange={selectDocument}>
                <SelectTrigger id='signature-fields-document' className='h-10 w-full'>
                  <SelectValue placeholder='Selecione um documento' />
                </SelectTrigger>
                <SelectContent>
                  {configuration.documents.map((item) => (
                    <SelectItem key={item.documentId} value={item.documentId}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              {configuration.documents.map((item) => {
                const isSelected = item.documentId === documentId
                const previewState = item.preview?.state
                const {
                  configuredFields,
                  configuredSignatoriesCount,
                  documentSignatories,
                  expectedSignatoryIds,
                  hasAllExpectedFields,
                } = getDocumentProgress(item)
                const statusLabel =
                  previewState === 'ready' && hasAllExpectedFields
                    ? 'Pronto'
                    : previewState === 'failed'
                      ? 'Falhou'
                      : previewState === 'stale'
                        ? 'Desatualizado'
                        : 'Pendente'
                const statusVariant =
                  previewState === 'ready' && hasAllExpectedFields
                    ? 'success'
                    : previewState === 'failed'
                      ? 'destructive'
                      : 'attention'

                return (
                  <div
                    key={item.documentId}
                    className={`flex w-full items-start gap-2 rounded-lg border p-2 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-muted/20 hover:bg-muted/50'
                    }`}
                  >
                    <button
                      type='button'
                      aria-pressed={isSelected}
                      className='flex min-w-0 flex-1 items-start gap-3 rounded-md p-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
                      onClick={() => selectDocument(item.documentId)}
                    >
                      <Icon
                        name='file-text'
                        className={`mt-0.5 size-4 shrink-0 ${
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      />
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-sm font-medium'>
                          {item.name}
                        </span>
                        <span className='mt-1 block text-xs text-muted-foreground'>
                          {configuredSignatoriesCount}/{expectedSignatoryIds.length}{' '}
                          {expectedSignatoryIds.length === 1
                            ? 'campo configurado'
                            : 'campos configurados'}
                        </span>
                      </span>
                      <Badge variant={statusVariant} className='shrink-0 px-2 py-1'>
                        {statusLabel}
                      </Badge>
                    </button>
                    <SignatureFieldsProgressDialog
                      documentName={item.name}
                      fields={configuredFields}
                      signatories={documentSignatories}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className='h-px bg-border' />

          <div className='space-y-4'>
            <div className='flex items-start gap-3'>
              <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <Icon name='pencil' className='size-4' />
              </span>
              <div>
                <h3 className='font-serif text-base font-semibold'>Signatário</h3>
                <p className='mt-1 text-xs leading-5 text-muted-foreground'>
                  Escolha quem assinará o novo campo.
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='signature-fields-signatory'>Signatário</Label>
              <Select value={selectedSignatoryId} onValueChange={setSelectedSignatoryId}>
                <SelectTrigger id='signature-fields-signatory' className='h-10 w-full'>
                  <SelectValue placeholder='Selecione um signatário' />
                </SelectTrigger>
                <SelectContent>
                  {configuration.signatories.map((signatory) => {
                    const isAssigned = availableSignatories.some(
                      (availableSignatory) =>
                        availableSignatory.signatoryId === signatory.signatoryId,
                    )

                    return (
                      <SelectItem
                        key={signatory.signatoryId}
                        value={signatory.signatoryId}
                        disabled={!isAssigned}
                      >
                        {signatory.name}
                        {!isAssigned ? ' · atribua ao documento' : ''}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {availableSignatories.length === 0 && (
                <div className='rounded-lg border border-border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground'>
                  <p>Este documento ainda não tem um signatário atribuído.</p>
                  {onOpenSignatories && (
                    <Button
                      type='button'
                      variant='link'
                      className='mt-1 h-auto p-0 text-xs text-primary'
                      onClick={onOpenSignatories}
                    >
                      Ir para Signatários
                    </Button>
                  )}
                </div>
              )}
            </div>

            <Button
              type='button'
              className='w-full'
              onClick={addField}
              disabled={
                isReadOnly || !canViewPreview || !previewId || !selectedSignatoryId
              }
            >
              <Icon name='plus' className='size-4' />
              Adicionar campo
            </Button>
          </div>
        </aside>

        <Card className='overflow-hidden border-border/80 shadow-none'>
          <CardHeader className='flex flex-col gap-4 border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-start gap-3'>
              <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border'>
                <Icon name='file-text' className='size-4' />
              </span>
              <div>
                <div className='flex flex-wrap items-center gap-2'>
                  <h3 className='font-medium'>Prévia do documento</h3>
                  <Badge variant='outline'>
                    {fields.length} {fields.length === 1 ? 'campo' : 'campos'}
                  </Badge>
                </div>
                <p className='mt-1 text-sm text-muted-foreground'>
                  Posicione os campos no PDF usando o mouse, toque ou teclado.
                </p>
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-2 self-end sm:self-auto'>
              <span className='mr-1 whitespace-nowrap text-xs font-medium text-muted-foreground'>
                Zoom
              </span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                aria-label='Reduzir zoom'
                disabled={zoom <= 0.75}
                onClick={decreaseZoom}
              >
                <Icon name='zoom-out' className='size-4' />
              </Button>
              <span className='min-w-14 text-center text-sm font-medium tabular-nums'>
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                aria-label='Aumentar zoom'
                disabled={zoom >= 1.5}
                onClick={increaseZoom}
              >
                <Icon name='plus' className='size-4' />
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 p-4 sm:p-5'>
            <div className='flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-1'>
                {isDirty && (
                  <p role='status' className='text-sm text-muted-foreground'>
                    Há alterações de campos não salvas.
                  </p>
                )}
                {Boolean(replaceSignatureFieldsError) && isDirty && (
                  <p role='alert' className='text-sm text-destructive'>
                    Não foi possível salvar os campos. Tente novamente; suas alterações
                    foram preservadas.
                  </p>
                )}
                {previewContent.isErrorPreviewContent &&
                  !previewContent.isFetchingPreviewContent && (
                    <p role='alert' className='text-sm text-destructive'>
                      Não foi possível carregar o PDF.
                    </p>
                  )}
              </div>
              <div className='flex flex-wrap justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  className='text-destructive hover:text-destructive'
                  disabled={
                    isReadOnly || fields.length === 0 || isReplacingSignatureFields
                  }
                  onClick={handleRequestRemoveAllFields}
                >
                  <Icon name='trash-2' className='size-4' />
                  Remover todos os campos
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  disabled={
                    isReadOnly ||
                    !previewId ||
                    !documentId ||
                    !canViewPreview ||
                    isReplacingSignatureFields
                  }
                  onClick={() => void persistLatest().catch(() => undefined)}
                >
                  <Icon name='check' className='size-4' />
                  {isReplacingSignatureFields ? 'Salvando...' : 'Salvar campos'}
                </Button>
              </div>
            </div>
            <RemoveAllSignatureFieldsDialog
              open={isRemoveAllFieldsDialogOpen}
              isPending={isReplacingSignatureFields}
              onOpenChange={setIsRemoveAllFieldsDialogOpen}
              onConfirm={handleRemoveAllFields}
            />
            <AlertDialog
              open={isDocumentChangeDialogOpen}
              onOpenChange={handleDocumentChangeDialogOpenChange}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Trocar de documento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Existem alterações de campos não salvas neste documento. O rascunho
                    atual será mantido enquanto você troca de documento.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Continuar editando</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDocumentChange}>
                    Trocar documento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {!preview && (
              <div
                role='status'
                className='rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground'
              >
                A prévia deste documento ainda está sendo preparada.
              </div>
            )}
            {preview?.state === 'failed' && (
              <div
                role='alert'
                className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm'
              >
                <span>Não foi possível preparar esta prévia.</span>
                <Button
                  type='button'
                  variant='outline'
                  disabled={isRetryingSignaturePreview}
                  onClick={() =>
                    void retrySignaturePreview({
                      previewId: preview.previewId,
                      expectedVersion,
                    })
                  }
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {(preview?.state === 'ready' || preview?.state === 'stale') && (
              <section
                aria-label='Visualização do PDF'
                ref={viewerRef}
                className='relative mx-auto max-h-[78vh] w-full max-w-none overflow-auto rounded-lg border border-border bg-muted/30'
              >
                {previewContent.isLoadingPreviewContent ||
                previewContent.isFetchingPreviewContent ? (
                  pdfViewerSkeleton
                ) : previewUrl ? (
                  <Suspense fallback={pdfViewerSkeleton}>
                    <PdfDocument
                      file={previewUrl}
                      loading={pdfViewerSkeleton}
                      error={
                        <div className='grid min-h-72 place-items-center p-4 text-sm text-destructive'>
                          Não foi possível renderizar o PDF.
                        </div>
                      }
                    >
                      <div ref={pageRef} className='relative mx-auto w-fit py-4'>
                        <PdfPage
                          pageNumber={selectedPage}
                          width={pageWidth}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                        {fields
                          .filter((field) => field.page === selectedPage)
                          .map((field) => (
                            <div
                              key={field.fieldId}
                              className='absolute'
                              style={{
                                left: `${field.positionX}%`,
                                top: `${field.positionY}%`,
                                width: `${field.width}%`,
                                height: `${field.height}%`,
                              }}
                            >
                              <button
                                type='button'
                                disabled={isReadOnly}
                                className='group flex h-full w-full min-w-0 cursor-move touch-none items-center gap-2 rounded-md border-2 border-primary bg-card/95 px-2.5 py-2 pr-8 text-left text-primary outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring'
                                aria-label={`Campo de assinatura para ${configuration.signatories.find((signatory) => signatory.signatoryId === field.signatoryId)?.name ?? 'Signatário'}`}
                                onKeyDown={(event) =>
                                  handleFieldKeyDown(field.fieldId, event)
                                }
                                onPointerDown={(event) =>
                                  handleFieldPointerDown(field.fieldId, event)
                                }
                                onPointerMove={(event) =>
                                  handleFieldPointerMove(field.fieldId, event)
                                }
                                onPointerUp={handleFieldPointerUp}
                                onPointerCancel={handleFieldPointerCancel}
                                onLostPointerCapture={handleFieldPointerCancel}
                              >
                                <span className='flex size-6 shrink-0 items-center justify-center rounded bg-primary/10 text-primary'>
                                  <Icon name='pencil' className='size-3.5' />
                                </span>
                                <span className='min-w-0 flex-1 leading-tight'>
                                  <span className='block truncate text-sm font-semibold'>
                                    Assinatura
                                  </span>
                                  <span className='mt-0.5 block truncate text-xs text-primary/70'>
                                    {configuration.signatories.find(
                                      (signatory) =>
                                        signatory.signatoryId === field.signatoryId,
                                    )?.name ?? 'Signatário'}
                                  </span>
                                </span>
                              </button>
                              <button
                                type='button'
                                aria-label='Remover campo de assinatura'
                                title='Remover campo'
                                disabled={isReadOnly}
                                className='absolute right-1 top-1 grid size-5 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'
                                onPointerDown={handleRemoveFieldPointerDown}
                                onClick={() => handleDeleteField(field.fieldId)}
                              >
                                <Icon name='x' className='size-3' />
                              </button>
                              <button
                                type='button'
                                aria-label='Redimensionar campo de assinatura'
                                title='Redimensionar campo'
                                disabled={isReadOnly}
                                className='absolute bottom-1 right-1 grid size-4 cursor-se-resize place-items-center rounded-sm bg-primary text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                onPointerDown={(event) =>
                                  handleResizePointerDown(field.fieldId, event)
                                }
                                onPointerMove={(event) =>
                                  handleResizePointerMove(field.fieldId, event)
                                }
                                onPointerUp={handleResizePointerUp}
                                onPointerCancel={handleFieldPointerCancel}
                                onLostPointerCapture={handleFieldPointerCancel}
                                onKeyDown={(event) => {
                                  handleResizeKeyDown(field.fieldId, event)
                                }}
                              >
                                <Icon name='ellipsis' className='size-3 rotate-90' />
                              </button>
                            </div>
                          ))}
                      </div>
                    </PdfDocument>
                  </Suspense>
                ) : (
                  <div className='grid h-full place-items-center p-4 text-sm text-muted-foreground'>
                    A prévia está pronta, mas o conteúdo ainda não está disponível.
                  </div>
                )}
              </section>
            )}
            {preview?.pageCount && preview.pageCount > 1 && (
              <div className='flex flex-wrap items-center gap-3 border-t border-border pt-4'>
                <span className='text-xs font-medium text-muted-foreground'>Página</span>
                <fieldset className='flex flex-wrap gap-2'>
                  <legend className='sr-only'>Páginas do documento</legend>
                  {Array.from({ length: preview.pageCount }, (_, index) => index + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        type='button'
                        size='sm'
                        variant={selectedPage === page ? 'default' : 'outline'}
                        onClick={() => setSelectedPage(page)}
                      >
                        {page}
                      </Button>
                    ),
                  )}
                </fieldset>
                <span className='text-xs text-muted-foreground'>
                  de {preview.pageCount}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
