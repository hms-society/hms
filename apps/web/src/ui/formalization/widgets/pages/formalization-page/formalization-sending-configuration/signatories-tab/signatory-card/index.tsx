import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Label } from '@/ui/shadcn/label'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { RemoveSignatureSignatoryDialog } from '../../remove-signature-signatory-dialog'
import { useSignatoryCard } from './use-signatory-card'
import type { SignatoryCardProps } from './use-signatory-card'

export type { SignatoryCardProps } from './use-signatory-card'

export const SignatoryCard = (props: SignatoryCardProps) => {
  const {
    handleConfirmRemove,
    handleRemoveDialogOpenChange,
    handleToggleDocument,
    isPending,
    isRemovingSignatory,
    onSelectChannel,
    removeSignatoryError,
    removeDialogOpen,
  } = useSignatoryCard(props)
  const { signatory, documents, selectedDocuments } = props

  return (
    <Card className='overflow-hidden border-border/80'>
      <CardHeader className='border-b border-border bg-muted/20 p-4 sm:p-5'>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-3'>
            <Avatar size='lg' className='bg-primary'>
              <AvatarFallback className='bg-primary text-primary-foreground'>
                <Icon name='user' className='size-4' />
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <h4 className='truncate font-serif text-lg font-semibold'>
                {signatory.name}
              </h4>
              <div className='mt-1 flex flex-wrap items-center gap-2'>
                <p className='text-xs text-muted-foreground'>
                  {signatory.role === 'client'
                    ? 'Cliente'
                    : signatory.role === 'responsible_lawyer'
                      ? 'Advogado responsável'
                      : 'Colaborador adicional'}
                </p>
                {!signatory.removable && (
                  <Badge variant='outline' className='h-5 px-2 text-[11px]'>
                    Obrigatório
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {signatory.removable && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              aria-label={`Remover ${signatory.name}`}
              disabled={isRemovingSignatory}
              onClick={() => handleRemoveDialogOpenChange(true)}
            >
              <Icon name='trash-2' className='size-4' />
              <span className='sr-only'>Remover signatário</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className='grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(190px,0.7fr)_minmax(0,1.3fr)] lg:gap-8'>
        <section
          className='space-y-3'
          aria-labelledby={`${signatory.signatoryId}-channel-label`}
        >
          <div>
            <Label id={`${signatory.signatoryId}-channel-label`}>Canal de envio</Label>
            <p className='mt-1 text-xs text-muted-foreground'>
              Escolha uma opção disponível.
            </p>
          </div>
          <fieldset className='flex flex-wrap gap-2'>
            {signatory.availableChannels.map((channel) => (
              <label
                key={channel}
                htmlFor={`${signatory.signatoryId}-channel-${channel}`}
                className='flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10'
              >
                <Checkbox
                  id={`${signatory.signatoryId}-channel-${channel}`}
                  checked={signatory.selectedChannels.includes(channel)}
                  disabled={isPending}
                  aria-label={channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                  onCheckedChange={(checked) =>
                    onSelectChannel(channel, checked === true)
                  }
                />
                <Icon
                  name={channel === 'whatsapp' ? 'message-square' : 'mail'}
                  className='size-4'
                />
                {channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
              </label>
            ))}
            {signatory.availableChannels.length === 0 && (
              <p className='rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
                Nenhum canal disponível.
              </p>
            )}
          </fieldset>
        </section>
        <section className='space-y-3 lg:border-l lg:border-border lg:pl-8'>
          <div className='flex flex-wrap items-end justify-between gap-2'>
            <div>
              <Label>Documentos atribuídos</Label>
              <p className='mt-1 text-xs text-muted-foreground'>
                Defina quais documentos este signatário deve assinar.
              </p>
            </div>
            <span className='text-xs font-medium text-muted-foreground'>
              {selectedDocuments.length} de {documents.length} selecionados
            </span>
          </div>
          <div className='grid gap-2 sm:grid-cols-2'>
            {documents.map((document) => (
              <label
                key={document.documentId}
                htmlFor={`${signatory.signatoryId}-${document.documentId}`}
                className='flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring'
              >
                <Checkbox
                  id={`${signatory.signatoryId}-${document.documentId}`}
                  checked={selectedDocuments.includes(document.documentId)}
                  disabled={isPending}
                  onCheckedChange={() => handleToggleDocument(document.documentId)}
                />
                <span className='truncate'>{document.name}</span>
              </label>
            ))}
          </div>
        </section>
      </CardContent>
      <RemoveSignatureSignatoryDialog
        open={removeDialogOpen}
        name={signatory.name}
        isPending={isRemovingSignatory}
        error={removeSignatoryError}
        onOpenChange={handleRemoveDialogOpenChange}
        onConfirm={handleConfirmRemove}
      />
    </Card>
  )
}
