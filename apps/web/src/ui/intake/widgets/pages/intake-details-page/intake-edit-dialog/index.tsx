import type { ReactNode } from 'react'
import { Controller } from 'react-hook-form'

import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Textarea } from '@/ui/shadcn/textarea'

import { useIntakeEditDialog, type IntakeEditDialogProps } from './use-intake-edit-dialog'

const originLabels = {
  direct: 'Entrada direta HMS',
  referral: 'Indicação',
  website: 'Site do HMS',
  social_media: 'Redes sociais',
  other: 'Outra origem',
} as const

const contactChannelLabels = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  phone: 'Telefone',
  in_person: 'Escritório / Presencial',
} as const

const urgencyLabels = {
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
} as const

export const IntakeEditDialog = (props: IntakeEditDialogProps) => {
  const {
    error,
    form,
    handleLegalAreaChange,
    handleSubmit,
    isLoadingOptions,
    isPending,
    legalAreas,
    legalTopics,
    optionsError,
    responsibles,
  } = useIntakeEditDialog(props)
  const { control, formState } = form

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-[680px]'>
        <DialogHeader className='border-b border-border px-6 py-5 pr-14'>
          <DialogTitle className='font-serif text-2xl font-semibold text-brand'>
            Editar Intake
          </DialogTitle>
          <DialogDescription>
            Atualize os dados operacionais sem alterar o Cliente ou o status do Intake.
          </DialogDescription>
        </DialogHeader>

        <form className='space-y-5 px-6 py-5' onSubmit={form.handleSubmit(handleSubmit)}>
          <div className='space-y-2'>
            <Label htmlFor='intake-edit-demand-notes'>Demanda</Label>
            <Controller
              name='demandNotes'
              control={control}
              render={({ field, fieldState }) => (
                <div className='space-y-1.5'>
                  <Textarea
                    {...field}
                    id='intake-edit-demand-notes'
                    placeholder='Descreva a demanda principal do cliente'
                    rows={4}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </div>
              )}
            />
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <EditSelectField
              control={control}
              name='origin'
              label='Origem'
              placeholder='Selecione a origem'
              options={originLabels}
            />
            <EditSelectField
              control={control}
              name='contactChannel'
              label='Canal de contato'
              placeholder='Selecione o canal'
              options={contactChannelLabels}
            />
            <EditSelectField
              control={control}
              name='urgency'
              label='Urgência'
              placeholder='Selecione a urgência'
              options={urgencyLabels}
            />
            <Controller
              name='responsibleId'
              control={control}
              render={({ field, fieldState }) => (
                <div className='space-y-2'>
                  <Label htmlFor='intake-edit-responsible'>Atendente</Label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id='intake-edit-responsible'
                      className='w-full'
                      disabled={isLoadingOptions}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder='Selecione o atendente' />
                    </SelectTrigger>
                    <SelectContent>
                      {responsibles.map((responsible) => (
                        <SelectItem
                          key={responsible.responsibleId}
                          value={responsible.responsibleId}
                        >
                          {responsible.professionalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </div>
              )}
            />
            <Controller
              name='legalAreaId'
              control={control}
              render={({ field, fieldState }) => (
                <div className='space-y-2'>
                  <Label htmlFor='intake-edit-legal-area'>Área jurídica</Label>
                  <Select onValueChange={handleLegalAreaChange} value={field.value}>
                    <SelectTrigger
                      id='intake-edit-legal-area'
                      className='w-full'
                      disabled={isLoadingOptions}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder='Selecione a área' />
                    </SelectTrigger>
                    <SelectContent>
                      {legalAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </div>
              )}
            />
            <Controller
              name='legalTopicId'
              control={control}
              render={({ field, fieldState }) => (
                <div className='space-y-2'>
                  <Label htmlFor='intake-edit-legal-topic'>Assunto jurídico</Label>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingOptions || !form.getValues('legalAreaId')}
                  >
                    <SelectTrigger
                      id='intake-edit-legal-topic'
                      className='w-full'
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder='Selecione o assunto' />
                    </SelectTrigger>
                    <SelectContent>
                      {legalTopics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </div>
              )}
            />
          </div>

          {optionsError && (
            <p className='text-sm text-destructive' role='alert'>
              Não foi possível carregar todas as opções do formulário.
            </p>
          )}
          {error && (
            <p className='text-sm text-destructive' role='alert'>
              {error.message}
            </p>
          )}

          <DialogFooter className='-mx-6 border-t border-border bg-card px-6 pt-5'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => props.onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type='submit' disabled={isPending || !formState.isDirty}>
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type EditSelectFieldProps = {
  control: ReturnType<typeof useIntakeEditDialog>['form']['control']
  name: 'origin' | 'contactChannel' | 'urgency'
  label: string
  placeholder: string
  options: Record<string, string>
}

function EditSelectField({
  control,
  name,
  label,
  placeholder,
  options,
}: EditSelectFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className='space-y-2'>
          <Label htmlFor={`intake-edit-${name}`}>{label}</Label>
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger
              id={`intake-edit-${name}`}
              className='w-full'
              aria-invalid={fieldState.invalid}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(options).map(([value, optionLabel]) => (
                <SelectItem key={value} value={value}>
                  {optionLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && <FieldError>{fieldState.error.message}</FieldError>}
        </div>
      )}
    />
  )
}

function FieldError({ children }: { children?: ReactNode }) {
  return <p className='text-xs text-destructive'>{children}</p>
}
