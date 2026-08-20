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
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { PageTitle } from '@/ui/shared/widgets/components/page-title'
import { DocumentEditor } from '@/ui/document-production/widgets/pages/document-specification-page/document-editor'
import {
  type ConsultationDocumentVersionPageProps,
  useConsultationDocumentVersionPage,
} from './use-consultation-document-version-page'

export type { ConsultationDocumentVersionPageProps }

export const ConsultationDocumentVersionPage = (
  props: ConsultationDocumentVersionPageProps,
) => {
  const {
    document,
    handleApprove,
    handleOpenRejectDialog,
    handleReject,
    handleRejectDialogOpenChange,
    isError,
    isLoading,
    isRejectDialogOpen,
    isReviewable,
    isReviewing,
    rejectionReason,
    setRejectionReason,
    version,
  } = useConsultationDocumentVersionPage(props)

  if (isLoading) {
    return (
      <main className='mx-auto w-full animate-pulse space-y-4'>
        <div className='h-8 w-72 rounded bg-muted' />
        <div className='h-[32rem] rounded-xl bg-muted/50' />
      </main>
    )
  }

  if (isError || !version) {
    return (
      <main className='mx-auto flex w-full flex-col gap-4'>
        <PageTitle className='text-2xl'>Versão não encontrada</PageTitle>
        <p className='text-sm text-muted-foreground'>
          Não foi possível localizar esta versão do documento na consulta.
        </p>
        <Button asChild variant='outline' className='w-fit'>
          <Anchor
            route='consultationDocuments'
            params={{ consultationId: props.consultationId }}
          >
            <Icon name='arrow-left' />
            Voltar para documentos
          </Anchor>
        </Button>
      </main>
    )
  }

  const statusLabel =
    version.status === 'in_review'
      ? 'Em revisão'
      : version.status === 'approved'
        ? 'Aprovado'
        : 'Rejeitado'

  return (
    <main className='mx-auto flex w-full flex-col gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Button asChild variant='link' className='h-auto w-fit px-0 text-primary'>
          <Anchor
            route='consultationDocuments'
            params={{ consultationId: props.consultationId }}
          >
            <Icon name='arrow-left' className='size-4' />
            Voltar para documentos
          </Anchor>
        </Button>
        <span className='rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground'>
          {statusLabel}
        </span>
      </div>

      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <PageTitle className='text-2xl'>{document?.title ?? 'Documento'}</PageTitle>
          <p className='mt-1 text-sm text-muted-foreground'>
            Versão {version.versionNumber} ·{' '}
            {version.source === 'ai' ? 'Gerada por IA' : 'Preenchimento manual'}
          </p>
        </div>
        {isReviewable && (
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='destructive'
              disabled={isReviewing}
              onClick={handleOpenRejectDialog}
            >
              <Icon name='x-circle' />
              Rejeitar geração
            </Button>
            <Button
              type='button'
              disabled={isReviewing}
              onClick={() => void handleApprove()}
            >
              <Icon name='check' />
              {isReviewing ? 'Aprovando...' : 'Aprovar documento'}
            </Button>
          </div>
        )}
      </header>

      <section className='overflow-hidden rounded-xl border bg-card'>
        <div className='border-b px-4 py-3'>
          <h2 className='text-base font-semibold'>Conteúdo do documento</h2>
          <p className='mt-1 text-xs text-muted-foreground'>
            {isReviewable
              ? 'Revise o conteúdo gerado antes de aprovar ou rejeitar a geração.'
              : 'Visualização da versão registrada na consulta.'}
          </p>
        </div>
        <DocumentEditor
          content={version.content}
          onChange={() => undefined}
          editable={false}
        />
      </section>

      <Dialog open={isRejectDialogOpen} onOpenChange={handleRejectDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar geração</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O documento continuará no pacote para
              preenchimento manual.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label='Motivo da rejeição'
            placeholder='Descreva o que precisa ser corrigido.'
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            disabled={isReviewing}
          />
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleRejectDialogOpenChange(false)}
              disabled={isReviewing}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={isReviewing || !rejectionReason.trim()}
              onClick={() => void handleReject()}
            >
              {isReviewing ? 'Rejeitando...' : 'Rejeitar geração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
