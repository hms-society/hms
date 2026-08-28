import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/shadcn/dialog'
import { CollaboratorAvatar } from '@/ui/identity/widgets/components/collaborator-avatar'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  useSignatureFieldsProgressDialog,
  type SignatureFieldsProgressDialogProps,
} from './use-signature-fields-progress-dialog'

export type { SignatureFieldsProgressDialogProps } from './use-signature-fields-progress-dialog'

export const SignatureFieldsProgressDialog = (
  props: SignatureFieldsProgressDialogProps,
) => {
  const { handleOpenChange, open, signatoryStatuses, configuredSignatoriesCount } =
    useSignatureFieldsProgressDialog(props)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='mt-0.5 shrink-0 text-muted-foreground'
          aria-label={`Ver campos de ${props.documentName}`}
          title='Ver campos configurados'
        >
          <Icon name='list-checks' className='size-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-[34rem]'>
        <DialogHeader className='pr-8'>
          <div className='flex items-start gap-3'>
            <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <Icon name='list-checks' className='size-5' />
            </span>
            <div className='min-w-0'>
              <DialogTitle>Campos de assinatura</DialogTitle>
              <DialogDescription className='mt-1 truncate'>
                {props.documentName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-3'>
          <div className='flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm'>
            <span className='text-muted-foreground'>Progresso</span>
            <span className='font-medium'>
              {configuredSignatoriesCount}/{signatoryStatuses.length} configurados
            </span>
          </div>

          {signatoryStatuses.length > 0 ? (
            <div className='space-y-2'>
              {signatoryStatuses.map((signatory) => (
                <div
                  key={signatory.signatoryId}
                  className='flex items-center gap-3 rounded-lg border border-border bg-background p-3'
                >
                  <CollaboratorAvatar
                    name={signatory.name}
                    colorSeed={signatory.signatoryId}
                    className='size-9'
                  />
                  <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                    {signatory.name}
                  </span>
                  <Badge
                    variant={signatory.isConfigured ? 'success' : 'secondary'}
                    className='shrink-0 gap-1.5'
                  >
                    <Icon
                      name={signatory.isConfigured ? 'check-circle-2' : 'clock'}
                      className='size-3.5'
                    />
                    {signatory.isConfigured ? 'Configurado' : 'Não configurado'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className='rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground'>
              Nenhum signatário atribuído a este documento.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => handleOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
