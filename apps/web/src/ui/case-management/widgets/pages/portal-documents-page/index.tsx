import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { CaseChecklistItem } from '@hms/core/case-management/domain/entities'
import type { PortalDocumentUploadResponse } from '@hms/core/case-management/interfaces'

import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { PortalUploadDialog } from './portal-upload-dialog'
import { usePortalDocumentsPage } from './use-portal-documents-page'

export type PortalDocumentsPageProps = {
  caseId: string
  portalToken: string
}

const statusLabels: Record<string, string> = {
  documentation: 'Documentação',
  ready_for_legal_production: 'Pronto para produção jurídica',
  legal_production: 'Produção jurídica',
  protocol_delivery: 'Entrega de protocolo',
  execution: 'Execução',
  closed: 'Encerrado',
  registered: 'Registrado',
  consultation_scheduling: 'Agendando consulta',
  consultation_scheduling_failed: 'Agendamento com falha',
  consultation_scheduled: 'Consulta agendada',
  consultation_completed: 'Consulta realizada',
  viability_registered: 'Viabilidade registrada',
  in_formalization: 'Em formalização',
  contracted: 'Contratado',
  closed_without_contract: 'Encerrado sem contratação',
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll('_', ' ')
}

function DocumentRow({
  item,
  status,
  onUpload,
}: {
  item: CaseChecklistItem
  status: 'pending' | 'in_analysis' | 'validated'
  onUpload?: (item: CaseChecklistItem) => void
}) {
  const isPending = status === 'pending'
  const isValidated = status === 'validated'

  return (
    <div className='flex flex-col gap-4 border-b border-border px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex min-w-0 items-start gap-3'>
        <div className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-highlight'>
          <Icon
            name={isPending ? 'file-minus' : isValidated ? 'check-circle-2' : 'clock'}
            className={`size-4 ${isValidated ? 'text-emerald-600' : 'text-primary'}`}
          />
        </div>
        <div className='min-w-0'>
          <p className='truncate font-sans text-sm font-semibold text-foreground'>
            {item.title}
          </p>
          <p className='mt-1 font-sans text-xs text-muted-foreground'>
            {isPending
              ? item.documentFileName
                ? 'Envie uma nova versão do documento para resolver esta pendência.'
                : 'Envie um arquivo legível para resolver esta pendência.'
              : isValidated
                ? item.documentFileName
                  ? `${item.documentFileName} · documento validado`
                  : 'Documento validado pela equipe.'
                : item.documentFileName
                  ? `${item.documentFileName} · aguardando análise`
                  : 'Documento recebido e encaminhado para análise.'}
          </p>
        </div>
      </div>

      <div className='flex shrink-0 items-center gap-3 sm:pl-4'>
        <Badge
          variant={isPending ? 'waiting' : isValidated ? 'success' : 'attention'}
          className='rounded-pill px-2.5 py-1 text-[11px] font-semibold'
        >
          {isPending ? 'Pendente' : isValidated ? 'Validado' : 'Em análise'}
        </Badge>
        {isPending && onUpload && (
          <Button
            type='button'
            variant='brand'
            size='sm'
            className='rounded-pill px-4 font-semibold'
            onClick={() => onUpload(item)}
          >
            Enviar documento
            <Icon name='chevron-right' className='size-3.5' />
          </Button>
        )}
      </div>
    </div>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  return (
    <section className='overflow-hidden rounded-xl border border-border bg-card shadow-card'>
      <div className='flex items-center justify-between border-b border-border px-5 py-4'>
        <h2 className='font-serif text-lg font-semibold text-brand'>{title}</h2>
        <span className='font-sans text-xs font-semibold text-muted-foreground'>
          {count} {count === 1 ? 'documento' : 'documentos'}
        </span>
      </div>
      {children}
    </section>
  )
}

export function PortalDocumentsPage({ caseId, portalToken }: PortalDocumentsPageProps) {
  const {
    pendingItems,
    inAnalysisItems,
    validatedItems,
    portalCase,
    isLoading,
    error,
    refetch,
  } = usePortalDocumentsPage(caseId, portalToken)
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<CaseChecklistItem | null>(null)
  const [uploadResult, setUploadResult] = useState<PortalDocumentUploadResponse | null>(
    null,
  )
  const [activeSection, setActiveSection] = useState<'documents' | 'tracking'>(
    'documents',
  )
  const canUpload = portalCase?.canUpload === true
  const canViewTracking =
    portalCase?.canViewCaseStatus === true || portalCase?.canViewIntakeStatus === true
  const visibleSection =
    activeSection === 'documents' && canUpload
      ? 'documents'
      : canViewTracking
        ? 'tracking'
        : 'documents'

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedItem) throw new Error('Selecione uma pendência antes de enviar.')

      const formData = new FormData()
      formData.append('file', file)

      const response = await caseManagementService.uploadPortalDocument(
        caseId,
        selectedItem.id,
        portalToken,
        formData,
      )

      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (result) => {
      setUploadResult(result)
      void queryClient.invalidateQueries({
        queryKey: ['portal-pending-checklist', caseId, portalToken],
      })
    },
  })

  function handleUpload(item: CaseChecklistItem) {
    uploadMutation.reset()
    setUploadResult(null)
    setSelectedItem(item)
  }

  function handleDialogChange(open: boolean) {
    if (open) return
    setSelectedItem(null)
    setUploadResult(null)
    uploadMutation.reset()
  }

  if (isLoading) {
    return (
      <main className='min-h-screen bg-background px-4 py-8 sm:px-8'>
        <div className='mx-auto max-w-5xl space-y-4'>
          <div className='h-8 w-56 animate-pulse rounded-lg bg-muted' />
          <div className='h-24 animate-pulse rounded-xl bg-card' />
          <div className='h-56 animate-pulse rounded-xl bg-card' />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8'>
        <section className='w-full max-w-md rounded-xl border border-destructive/20 bg-card p-6 text-center shadow-card'>
          <Icon name='shield-alert' className='mx-auto size-8 text-destructive' />
          <h1 className='mt-4 font-serif text-xl font-semibold text-brand'>
            Não foi possível acessar este portal
          </h1>
          <p className='mt-2 font-sans text-sm text-muted-foreground'>
            O link pode ter expirado ou não é válido para este caso.
          </p>
          <Button
            type='button'
            variant='brand'
            className='mt-5 rounded-pill px-5'
            onClick={() => refetch()}
          >
            Tentar novamente
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className='min-h-screen bg-background px-4 py-8 sm:px-8'>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-8'>
        <header className='rounded-xl border border-border bg-card px-6 py-7 shadow-card sm:px-8'>
          <div className='flex items-center gap-2 font-sans text-xs font-semibold text-primary'>
            <Icon name='shield-check' className='size-4' />
            Portal seguro de documentos
          </div>
          <h1 className='mt-3 font-serif text-3xl font-semibold text-brand sm:text-4xl'>
            Portal do terceiro
          </h1>
          <p className='mt-2 max-w-2xl font-sans text-sm leading-6 text-muted-foreground'>
            {canUpload
              ? 'Acompanhe o caso e envie os documentos solicitados com segurança.'
              : 'Acompanhe as atualizações disponíveis para este acesso.'}
          </p>
          {portalCase && (
            <div className='mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3'>
              <div>
                <p className='font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Caso
                </p>
                <p className='mt-1 font-sans text-sm font-semibold text-foreground'>
                  {portalCase.publicCode}
                </p>
              </div>
              <div>
                <p className='font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Título
                </p>
                <p className='mt-1 font-sans text-sm font-semibold text-foreground'>
                  {portalCase.title}
                </p>
              </div>
              <div>
                <p className='font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                  Cliente
                </p>
                <p className='mt-1 font-sans text-sm font-semibold text-foreground'>
                  {portalCase.clientName}
                </p>
              </div>
            </div>
          )}
        </header>

        <div className='grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]'>
          <nav className='flex gap-2 rounded-xl border border-border bg-card p-2 shadow-card lg:flex-col lg:self-start'>
            {canUpload && (
              <button
                type='button'
                className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-3 text-left font-sans text-sm font-semibold transition-colors lg:flex-none ${visibleSection === 'documents' ? 'bg-highlight text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                onClick={() => setActiveSection('documents')}
              >
                <Icon name='file-text' className='size-4' />
                Documentos
              </button>
            )}
            {canViewTracking && (
              <button
                type='button'
                className={`flex flex-1 items-center gap-2 rounded-lg px-3 py-3 text-left font-sans text-sm font-semibold transition-colors lg:flex-none ${visibleSection === 'tracking' ? 'bg-highlight text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                onClick={() => setActiveSection('tracking')}
              >
                <Icon name='chart-line' className='size-4' />
                Acompanhamento
              </button>
            )}
          </nav>

          <div className='flex flex-col gap-6'>
            {visibleSection === 'tracking' && portalCase ? (
              <section className='rounded-xl border border-border bg-card p-5 shadow-card sm:p-6'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <h2 className='font-serif text-2xl font-semibold text-brand'>
                      Acompanhamento do caso
                    </h2>
                    <p className='mt-1 font-sans text-sm text-muted-foreground'>
                      Consulte as atualizações disponíveis para este acesso.
                    </p>
                  </div>
                  {portalCase.canViewCaseStatus && portalCase.status && (
                    <Badge
                      variant='info'
                      className='rounded-pill px-2.5 py-1 text-[11px] font-semibold'
                    >
                      {getStatusLabel(portalCase.status)}
                    </Badge>
                  )}
                </div>
                <div className='mt-6 space-y-4 border-l-2 border-highlight pl-5'>
                  {portalCase.canViewCaseStatus && portalCase.status && (
                    <div>
                      <p className='font-sans text-sm font-semibold text-foreground'>
                        Status do caso
                      </p>
                      <p className='mt-1 font-sans text-sm text-muted-foreground'>
                        {getStatusLabel(portalCase.status)}
                      </p>
                    </div>
                  )}
                  {portalCase.intake && (
                    <div>
                      <p className='font-sans text-sm font-semibold text-foreground'>
                        Status do intake
                      </p>
                      <p className='mt-1 font-sans text-sm text-muted-foreground'>
                        {getStatusLabel(portalCase.intake.status)}
                      </p>
                    </div>
                  )}
                  {portalCase.updatedAt && (
                    <div>
                      <p className='font-sans text-sm font-semibold text-foreground'>
                        Última atualização
                      </p>
                      <p className='mt-1 font-sans text-sm text-muted-foreground'>
                        {new Date(portalCase.updatedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='font-serif text-2xl font-semibold text-brand'>
                      Acompanhamento documental
                    </h2>
                    <p className='mt-1 font-sans text-sm text-muted-foreground'>
                      Resolva as pendências abaixo para dar continuidade ao atendimento.
                    </p>
                  </div>
                </div>

                <Section title='Documentos pendentes' count={pendingItems.length}>
                  {pendingItems.length > 0 ? (
                    pendingItems.map((item) => (
                      <DocumentRow
                        key={item.id}
                        item={item}
                        status='pending'
                        onUpload={portalCase?.canUpload ? handleUpload : undefined}
                      />
                    ))
                  ) : (
                    <div className='px-5 py-8 text-center font-sans text-sm text-muted-foreground'>
                      Não há documentos pendentes no momento.
                    </div>
                  )}
                </Section>

                <Section
                  title='Documentos enviados'
                  count={inAnalysisItems.length + validatedItems.length}
                >
                  {inAnalysisItems.length + validatedItems.length > 0 ? (
                    [...inAnalysisItems, ...validatedItems].map((item) => (
                      <DocumentRow key={item.id} item={item} status={item.status} />
                    ))
                  ) : (
                    <div className='px-5 py-8 text-center font-sans text-sm text-muted-foreground'>
                      Nenhum documento foi enviado ainda.
                    </div>
                  )}
                </Section>
              </>
            )}
          </div>
        </div>
      </div>

      <PortalUploadDialog
        item={selectedItem}
        open={Boolean(selectedItem)}
        isUploading={uploadMutation.isPending}
        protocol={uploadResult?.protocol}
        error={uploadMutation.error?.message}
        onOpenChange={handleDialogChange}
        onSubmit={async (file) => {
          uploadMutation.mutate(file)
        }}
      />
    </main>
  )
}
