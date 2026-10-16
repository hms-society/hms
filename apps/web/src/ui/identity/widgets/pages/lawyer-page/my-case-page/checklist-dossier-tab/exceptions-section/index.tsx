import type { ChecklistDossierController } from '../types'
import { DocumentExceptionCard } from '../document-exception-card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'

export type ExceptionsSectionProps = {
  controller: ChecklistDossierController
  readOnly: boolean
}

export const ExceptionsSection = ({ controller, readOnly }: ExceptionsSectionProps) => (
  <section className='flex flex-col gap-3 rounded-lg border border-border bg-secondary p-5 shadow-xs'>
    <h2 className='font-serif text-lg font-semibold text-foreground'>
      Exceções Documentais
    </h2>
    {controller.exceptions.length ? (
      <div className='flex flex-col gap-2'>
        {controller.exceptions.map((exception) => (
          <DocumentExceptionCard
            approveException={controller.approveException}
            canApprove={controller.canApprove}
            exception={exception}
            isApprovingException={controller.isApprovingException}
            key={exception.id}
            onOpenReject={controller.handleOpenRejectModal}
            onViewJustification={controller.setJustificationToView}
            title={
              controller.state.checklistItems.find(
                (item) => item.id === exception.documentId,
              )?.title ?? 'Documento não identificado'
            }
          />
        ))}
      </div>
    ) : (
      <div className='flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-[14px] text-muted-foreground'>
        <Icon name='shield-check' className='size-3.5 text-primary' />
        Nenhuma exceção ativa neste caso.
      </div>
    )}
    <p className='text-[14px] text-muted-foreground'>
      Quando um documento não puder ser obtido, solicite exceção com justificativa. A
      aprovação é de outro perfil autorizado — o solicitante não aprova a própria exceção.
    </p>
    {!readOnly && (
      <Button
        variant='brand'
        size='xs'
        className='h-9 w-full rounded-full bg-background text-[14px]'
        onClick={controller.state.handleRequestDocumentException}
      >
        <Icon name='alert-triangle' className='size-3.5' />
        Solicitar exceção documental
      </Button>
    )}
  </section>
)
