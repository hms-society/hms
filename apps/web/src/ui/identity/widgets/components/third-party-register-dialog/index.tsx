import type {
  ThirdPartyRelationshipType,
  ThirdPartyType,
} from '@hms/core/identity/domain/structures'

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
import { Label } from '@/ui/shadcn/label'
import {
  useThirdPartyRegisterDialog,
  type ThirdPartyRegisterDialogProps,
} from './use-third-party-register-dialog'

const typeOptions: readonly [ThirdPartyType, string][] = [
  ['union', 'Sindicato'],
  ['association', 'Associação'],
  ['partner_company', 'Empresa parceira'],
  ['institutional_partner', 'Parceiro institucional'],
  ['other', 'Outro'],
]

const documentOptions = [
  ['cnpj', 'CNPJ'],
  ['official_registration', 'Registro oficial equivalente'],
  ['other_national_document', 'Outro documento nacional'],
] as const

const relationshipOptions: readonly [ThirdPartyRelationshipType, string][] = [
  ['demand_origin', 'Origem da demanda'],
  ['payer', 'Pagador'],
  ['representative_partner', 'Representante/parceiro'],
  ['document_supporter', 'Apoiador documental'],
  ['contractor', 'Contratante'],
  ['other', 'Outro'],
]

export type { ThirdPartyRegisterDialogProps }

export const ThirdPartyRegisterDialog = (props: ThirdPartyRegisterDialogProps) => {
  const {
    collaborators,
    form,
    handleFieldChange,
    handleRelationshipToggle,
    handleSubmit,
    isLoadingCollaborators,
    isRegisteringThirdParty,
    registerThirdPartyError,
    validationError,
  } = useThirdPartyRegisterDialog(props)

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='font-serif text-2xl text-brand'>
            Cadastrar terceiro
          </DialogTitle>
          <DialogDescription>
            Cadastre a entidade e defina a natureza do vínculo institucional.
          </DialogDescription>
        </DialogHeader>
        <form className='space-y-5' onSubmit={handleSubmit}>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='third-party-type'>Tipo</Label>
              <select
                id='third-party-type'
                value={form.type}
                onChange={(event) => handleFieldChange('type', event.target.value)}
                className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm'
              >
                {typeOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='third-party-tax-id-type'>Tipo de documento</Label>
              <select
                id='third-party-tax-id-type'
                value={form.taxIdType}
                onChange={(event) => handleFieldChange('taxIdType', event.target.value)}
                className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm'
              >
                {documentOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='third-party-legal-name'>Razão social ou nome *</Label>
              <Input
                id='third-party-legal-name'
                value={form.legalName}
                onChange={(event) => handleFieldChange('legalName', event.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='third-party-trade-name'>Nome fantasia</Label>
              <Input
                id='third-party-trade-name'
                value={form.tradeName ?? ''}
                onChange={(event) => handleFieldChange('tradeName', event.target.value)}
              />
            </div>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='third-party-tax-id'>Documento nacional *</Label>
              <Input
                id='third-party-tax-id'
                value={form.taxId}
                onChange={(event) => handleFieldChange('taxId', event.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='third-party-tax-id-description'>
                Descrição do documento
              </Label>
              <Input
                id='third-party-tax-id-description'
                value={form.taxIdDescription ?? ''}
                onChange={(event) =>
                  handleFieldChange('taxIdDescription', event.target.value)
                }
              />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='third-party-responsible'>Responsável interno *</Label>
            <select
              id='third-party-responsible'
              value={form.internalResponsibleId}
              onChange={(event) =>
                handleFieldChange('internalResponsibleId', event.target.value)
              }
              disabled={isLoadingCollaborators}
              className='h-11 w-full rounded-lg border border-input bg-background px-3 text-sm'
            >
              <option value=''>
                {isLoadingCollaborators
                  ? 'Carregando colaboradores...'
                  : 'Selecione um colaborador ativo'}
              </option>
              {collaborators.map((collaborator) => (
                <option
                  key={collaborator.collaboratorId}
                  value={collaborator.collaboratorId}
                >
                  {collaborator.professionalName}
                </option>
              ))}
            </select>
          </div>
          <fieldset className='space-y-3'>
            <legend className='text-sm font-medium'>Natureza do vínculo *</legend>
            <div className='grid gap-3 sm:grid-cols-2'>
              {relationshipOptions.map(([value, label]) => (
                <label
                  key={value}
                  className='flex items-center gap-2 text-sm text-foreground'
                >
                  <input
                    type='checkbox'
                    checked={form.relationshipTypes.includes(value)}
                    onChange={() => handleRelationshipToggle(value)}
                    className='size-4 accent-primary'
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          {(validationError || registerThirdPartyError) && (
            <p role='alert' className='text-sm text-destructive'>
              {validationError ?? 'Não foi possível cadastrar o terceiro.'}
            </p>
          )}
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              className='rounded-full'
              onClick={() => props.onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              className='rounded-full'
              disabled={isRegisteringThirdParty}
            >
              Cadastrar terceiro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
