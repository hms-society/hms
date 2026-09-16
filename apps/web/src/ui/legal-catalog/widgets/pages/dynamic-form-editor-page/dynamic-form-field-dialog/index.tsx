import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Textarea } from '@/ui/shadcn/textarea'
import { Checkbox } from '@/ui/shadcn/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui/shadcn/tooltip'
import { Icon } from '@/ui/shared/widgets/components/icon'
import type { DynamicFormEditorField } from '../types'
import type { DynamicFormFieldDialogProps } from './types'
import { useDynamicFormFieldDialog } from './use-dynamic-form-field-dialog'
import { DynamicFormTextFieldConfiguration } from './dynamic-form-text-field-configuration'
import { DynamicFormDateFieldConfiguration } from './dynamic-form-date-field-configuration'
import { DynamicFormBooleanFieldConfiguration } from './dynamic-form-boolean-field-configuration'
import { DynamicFormSelectionFieldConfiguration } from './dynamic-form-selection-field-configuration'
import { DynamicFormNumericFieldConfiguration } from './dynamic-form-numeric-field-configuration'

const labels: Record<string, string> = {
  short_text: 'Texto curto',
  long_text: 'Texto longo',
  date: 'Data',
  boolean: 'Sim/Não',
  multiple_selection: 'Múltipla escolha',
  single_selection: 'Seleção única',
  integer: 'Número inteiro',
  currency: 'Moeda',
  percentage: 'Percentual',
}

const helperCopy: Record<string, string> = {
  short_text: 'Resposta livre em uma linha',
  long_text: 'Resposta livre em várias linhas',
  date: 'O advogado selecionará a data pelo calendário.',
  boolean: 'Resposta objetiva entre Sim e Não',
  multiple_selection: 'Permite selecionar uma ou mais opções',
  single_selection: 'Permite selecionar somente uma opção.',
  integer: 'Aceita somente números inteiros, sem casas decimais.',
  currency: 'Formata o valor monetário conforme a moeda escolhida.',
  percentage: 'Aceita valores percentuais entre 0 e 100.',
}

const selectedTypeClasses: Record<string, string> = {
  short_text:
    'border-[var(--highlight-foreground)] bg-highlight text-highlight-foreground',
  long_text:
    'border-[var(--badge-success-border)] bg-[var(--badge-success)] text-[var(--badge-success-foreground)]',
  date: 'border-[var(--badge-info-border)] bg-[var(--badge-info)] text-[var(--badge-info-foreground)]',
  boolean:
    'border-[var(--badge-info-border)] bg-[var(--badge-info)] text-[var(--badge-info-foreground)]',
  multiple_selection:
    'border-[var(--badge-attention-border)] bg-[var(--badge-attention)] text-[var(--badge-attention-foreground)]',
  single_selection:
    'border-[var(--badge-waiting-border)] bg-[var(--badge-waiting)] text-[var(--badge-waiting-foreground)]',
  integer: 'border-border bg-secondary text-secondary-foreground',
  currency: 'border-[var(--highlight-foreground)] bg-highlight text-highlight-foreground',
  percentage:
    'border-[var(--badge-attention-border)] bg-[var(--badge-attention)] text-[var(--badge-attention-foreground)]',
}

const stageLabels = {
  consultation: 'Consulta',
  formalization: 'Formalização',
} as const

export function DynamicFormFieldDialog(props: DynamicFormFieldDialogProps) {
  const controller = useDynamicFormFieldDialog(props)
  const field = controller.field
  const label = props.stage === 'consultation' ? 'Pergunta' : 'Rótulo do campo'
  const context = `O campo será incluído ao final do formulário de ${stageLabels[props.stage]} para ${props.legalAreaName} · ${props.legalTopicNames.join(' · ')}.`
  const isBoolean = field.type === 'boolean'
  return (
    <TooltipProvider delayDuration={0}>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-popover p-0 ring-0 shadow-lg sm:max-w-[560px]'>
          <div className='flex min-h-0 flex-1 flex-col'>
            <DialogHeader className='shrink-0 border-b border-border px-5 pt-5 pb-4 pr-14'>
              <DialogTitle className='font-serif text-xl font-semibold text-brand'>
                {props.mode === 'create'
                  ? 'Adicionar campo ao formulário'
                  : 'Editar campo do formulário'}
              </DialogTitle>
              <DialogDescription className='text-xs leading-relaxed'>
                {context}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={controller.submit} className='flex min-h-0 flex-1 flex-col'>
              <div className='min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4.5'>
                <div className='space-y-1.5'>
                  <label
                    className='block text-xs font-medium'
                    htmlFor={`${field.clientId}-label`}
                  >
                    {label} *
                  </label>
                  <Input
                    autoFocus
                    id={`${field.clientId}-label`}
                    value={field.label}
                    onChange={(event) => controller.update({ label: event.target.value })}
                    aria-invalid={Boolean(controller.errors.label)}
                    aria-describedby={
                      controller.errors.label
                        ? `${field.clientId}-label-error`
                        : undefined
                    }
                  />
                  {controller.errors.label && (
                    <p
                      id={`${field.clientId}-label-error`}
                      className='text-xs text-destructive'
                    >
                      {controller.errors.label}
                    </p>
                  )}
                </div>

                <fieldset className='space-y-1.5'>
                  <legend className='text-xs font-medium'>Tipo *</legend>
                  <div
                    role='radiogroup'
                    aria-label='Tipo do campo'
                    className='flex flex-wrap gap-1.5'
                  >
                    {controller.allTypes.map((type) => {
                      return (
                        <Button
                          key={type}
                          type='button'
                          size='xs'
                          variant='outline'
                          className={`rounded-full px-3 ${field.type === type ? selectedTypeClasses[type] : ''}`}
                          aria-pressed={field.type === type}
                          aria-label={labels[type]}
                          onClick={() =>
                            controller.changeType(type as DynamicFormEditorField['type'])
                          }
                        >
                          {labels[type]}
                        </Button>
                      )
                    })}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    {helperCopy[field.type]}
                  </p>
                </fieldset>

                {isBoolean ? (
                  <DynamicFormBooleanFieldConfiguration
                    fieldClientId={field.clientId}
                    defaultValue={
                      typeof field.defaultValue === 'boolean'
                        ? field.defaultValue
                        : undefined
                    }
                    isDisabled={false}
                    onDefaultValueChange={(value) =>
                      controller.update({ defaultValue: value })
                    }
                  />
                ) : null}

                <div className='space-y-1.5'>
                  <div className='flex items-center gap-1'>
                    <label
                      className='text-xs font-medium'
                      htmlFor={`${field.clientId}-description`}
                    >
                      Descrição / dica{' '}
                      <span className='font-normal text-muted-foreground'>
                        (opcional)
                      </span>
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type='button'
                          size='icon-xs'
                          variant='ghost'
                          className='size-5 text-muted-foreground'
                          aria-label='Ajuda para a IA'
                        >
                          <Icon name='info' className='size-3.5' />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side='top'>
                        A IA usa esta orientação para entender o que deve ser preenchido e
                        sugerir respostas mais adequadas.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    id={`${field.clientId}-description`}
                    value={field.description ?? ''}
                    onChange={(event) =>
                      controller.update({ description: event.target.value })
                    }
                    aria-invalid={Boolean(controller.errors.description)}
                    aria-describedby={
                      controller.errors.description
                        ? `${field.clientId}-description-error`
                        : undefined
                    }
                  />
                  {controller.errors.description && (
                    <p
                      id={`${field.clientId}-description-error`}
                      className='text-xs text-destructive'
                    >
                      {controller.errors.description}
                    </p>
                  )}
                </div>

                {field.type === 'short_text' || field.type === 'long_text' ? (
                  <DynamicFormTextFieldConfiguration
                    fieldClientId={field.clientId}
                    type={field.type}
                    placeholder={field.placeholder}
                    defaultValue={
                      typeof field.defaultValue === 'string'
                        ? field.defaultValue
                        : undefined
                    }
                    isDisabled={false}
                    placeholderError={controller.errors.placeholder}
                    defaultValueError={controller.errors.defaultValue}
                    onPlaceholderChange={(value) =>
                      controller.update({ placeholder: value })
                    }
                    onDefaultValueChange={(value) =>
                      controller.update({ defaultValue: value })
                    }
                  />
                ) : null}
                {field.type === 'date' ? (
                  <DynamicFormDateFieldConfiguration
                    fieldClientId={field.clientId}
                    defaultValue={
                      typeof field.defaultValue === 'string'
                        ? field.defaultValue
                        : undefined
                    }
                    isDisabled={false}
                    defaultValueError={controller.errors.defaultValue}
                    onDefaultValueChange={(value) =>
                      controller.update({ defaultValue: value })
                    }
                  />
                ) : null}
                {field.type === 'single_selection' ||
                field.type === 'multiple_selection' ? (
                  <DynamicFormSelectionFieldConfiguration
                    fieldClientId={field.clientId}
                    mode={field.type}
                    options={field.options ?? []}
                    defaultOptionClientIds={field.defaultOptionClientIds ?? []}
                    isDisabled={false}
                    defaultValueError={controller.errors.defaultValue}
                    optionErrors={controller.errors.optionErrors}
                    onChange={({ options, defaultOptionClientIds }) =>
                      controller.update({ options, defaultOptionClientIds })
                    }
                  />
                ) : null}
                {field.type === 'integer' ||
                field.type === 'currency' ||
                field.type === 'percentage' ? (
                  <DynamicFormNumericFieldConfiguration
                    fieldClientId={field.clientId}
                    type={field.type}
                    placeholder={field.placeholder}
                    defaultValue={
                      typeof field.defaultValue === 'number'
                        ? field.defaultValue
                        : undefined
                    }
                    validation={field.validation}
                    currency={field.currency}
                    isDisabled={false}
                    errors={controller.errors}
                    onDefaultValueChange={(value) =>
                      controller.update({ defaultValue: value })
                    }
                    onPlaceholderChange={(value) =>
                      controller.update({ placeholder: value })
                    }
                    onValidationChange={(value) =>
                      controller.update({ validation: value })
                    }
                  />
                ) : null}

                <label
                  htmlFor={`${field.clientId}-required`}
                  className='flex items-center gap-2 text-sm'
                >
                  <Checkbox
                    id={`${field.clientId}-required`}
                    checked={field.required}
                    onCheckedChange={(checked) =>
                      controller.update({ required: checked === true })
                    }
                  />
                  Campo obrigatório
                </label>
                {controller.error && (
                  <p role='alert' className='text-xs text-destructive'>
                    {controller.error}
                  </p>
                )}
              </div>
              <DialogFooter className='mx-0 mb-0 shrink-0 rounded-none border-border bg-background px-5 py-4 sm:rounded-b-lg'>
                <Button
                  type='button'
                  variant='brand'
                  size='sm'
                  className='rounded-full px-6'
                  onClick={() => props.onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type='submit' size='sm' className='rounded-full px-6'>
                  Salvar campo
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

export type { DynamicFormFieldDialogProps }
