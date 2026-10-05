import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import type { ThirdParty } from '@hms/core/identity/domain/entities'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Icon } from '@/ui/shared/widgets/components/icon'

export type PortalAccessDialogProps = {
  canViewCaseStatus?: boolean
  canViewIntakeStatus?: boolean
  canUpload?: boolean
  expiresAt: string | null
  isGenerating?: boolean
  onGenerate?: () => void
  onCopy: () => void
  onCanViewCaseStatusChange?: (value: boolean) => void
  onCanViewIntakeStatusChange?: (value: boolean) => void
  onCanUploadChange?: (value: boolean) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  selectedThirdPartyId?: string
  onThirdPartyChange?: (thirdPartyId: string) => void
  thirdParties?: readonly ThirdParty[]
  url: string | null
}

export const PortalAccessDialog = ({
  canViewCaseStatus = false,
  canViewIntakeStatus = false,
  canUpload = false,
  expiresAt,
  isGenerating = false,
  onGenerate,
  onCopy,
  onCanViewCaseStatusChange = () => {},
  onCanViewIntakeStatusChange = () => {},
  onCanUploadChange = () => {},
  onOpenChange,
  open,
  selectedThirdPartyId = '',
  onThirdPartyChange,
  thirdParties = [],
  url,
}: PortalAccessDialogProps) => {
  const expirationLabel = expiresAt
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(expiresAt))
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='font-serif text-xl text-brand'>
            {url ? 'Link para terceiro gerado' : 'Gerar link para terceiro'}
          </DialogTitle>
          <DialogDescription>
            {url
              ? `Compartilhe este link com o terceiro para que ele acompanhe o caso e envie os documentos do cliente. ${expirationLabel ? `O link expira em ${expirationLabel}.` : 'O link permanece válido enquanto o acesso estiver ativo.'}`
              : 'Selecione o terceiro que receberá acesso ao portal deste caso.'}
          </DialogDescription>
        </DialogHeader>

        {url ? (
          <div className='flex flex-col gap-2'>
            <label
              htmlFor='portal-access-url'
              className='text-sm font-medium text-foreground'
            >
              Link de acesso
            </label>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <Input id='portal-access-url' readOnly value={url} className='min-w-0' />
              <Button type='button' className='rounded-full sm:shrink-0' onClick={onCopy}>
                <Icon name='copy' className='size-4' />
                Copiar link
              </Button>
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-5'>
            <label
              htmlFor='portal-third-party'
              className='text-sm font-medium text-foreground'
            >
              Terceiro
            </label>
            <select
              id='portal-third-party'
              value={selectedThirdPartyId}
              onChange={(event) => onThirdPartyChange?.(event.target.value)}
              className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'
            >
              <option value=''>Selecione um terceiro ativo</option>
              {thirdParties.map((thirdParty) => (
                <option key={thirdParty.id} value={thirdParty.id}>
                  {thirdParty.tradeName ?? thirdParty.legalName}
                </option>
              ))}
            </select>
            <fieldset className='space-y-3'>
              <legend className='text-sm font-medium text-foreground'>
                Permissões deste link
              </legend>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label className='flex items-center gap-2 text-sm text-foreground'>
                  <input
                    type='checkbox'
                    checked={canViewCaseStatus}
                    onChange={(event) => onCanViewCaseStatusChange(event.target.checked)}
                    className='size-4 accent-primary'
                  />
                  Visualizar status do caso
                </label>
                <label className='flex items-center gap-2 text-sm text-foreground'>
                  <input
                    type='checkbox'
                    checked={canViewIntakeStatus}
                    onChange={(event) =>
                      onCanViewIntakeStatusChange(event.target.checked)
                    }
                    className='size-4 accent-primary'
                  />
                  Visualizar status do intake
                </label>
                <label className='flex items-center gap-2 text-sm text-foreground sm:col-span-2'>
                  <input
                    type='checkbox'
                    checked={canUpload}
                    onChange={(event) => onCanUploadChange(event.target.checked)}
                    className='size-4 accent-primary'
                  />
                  Permitir envio de documentos
                </label>
              </div>
            </fieldset>
          </div>
        )}

        {url ? (
          <DialogFooter showCloseButton />
        ) : (
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              className='rounded-full'
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type='button'
              className='rounded-full'
              disabled={
                !selectedThirdPartyId ||
                (!canViewCaseStatus && !canViewIntakeStatus && !canUpload) ||
                isGenerating
              }
              onClick={onGenerate}
            >
              {isGenerating ? 'Gerando link...' : 'Gerar link'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
