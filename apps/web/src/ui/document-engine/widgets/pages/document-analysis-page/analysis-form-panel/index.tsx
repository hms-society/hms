import { Controller } from 'react-hook-form'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Field, FieldError } from '@/ui/shadcn/field'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { ChecklistLinkFields } from '../checklist-link-fields'
import { EditableExtractedFields } from '../editable-extracted-fields'
import { IllegibleDecisionState } from '../illegible-decision-state'
import {
  useAnalysisFormPanel,
  type AnalysisFormPanelProps,
} from './use-analysis-form-panel'

export type { AnalysisFormPanelProps } from './use-analysis-form-panel'

export const AnalysisFormPanel = ({
  form,
  currentDecision,
  isSubmitting,
  document,
  onSubmit,
  onRequestResend,
  onOpenDocument,
}: AnalysisFormPanelProps) => {
  const { handleOpenDuplicateDocument } = useAnalysisFormPanel({
    form,
    onOpenDocument,
  })

  return (
    <aside className='flex flex-col bg-card'>
      <form onSubmit={onSubmit} className='flex h-full flex-col' noValidate>
        <div className='flex flex-1 flex-col gap-6 p-6'>
          <div>
            <h2 className='font-sans text-sm font-semibold text-foreground'>
              Resultado da validação
            </h2>
          </div>

          <Field data-invalid={Boolean(form.formState.errors.decision)}>
            <Controller
              name='decision'
              control={form.control}
              render={({ field }) => (
                <NativeSelect
                  id='decision'
                  {...field}
                  className='w-full font-sans text-sm h-12'
                >
                  <NativeSelectOption value='validate'>Válido</NativeSelectOption>
                  <NativeSelectOption value='not_linked'>
                    Não vinculado
                  </NativeSelectOption>
                  <NativeSelectOption value='illegible'>Ilegível</NativeSelectOption>
                  <NativeSelectOption value='incomplete'>Incompleto</NativeSelectOption>
                  <NativeSelectOption value='duplicate' disabled={!document.duplicateMatch}>
                    Duplicado
                  </NativeSelectOption>
                  <NativeSelectOption value='mismatch'>
                    Não correspondente
                  </NativeSelectOption>
                  <NativeSelectOption value='escalate'>
                    Acionar Advogado
                  </NativeSelectOption>
                </NativeSelect>
              )}
            />
            <FieldError>{form.formState.errors.decision?.message}</FieldError>
          </Field>

          {currentDecision === 'validate' && (
            <div className='flex flex-col gap-5'>
              <p className='font-sans text-xs text-muted-foreground'>
                Revise o vínculo, ajuste os dados extraídos quando necessário e confirme
                somente se o documento estiver apto para validação.
              </p>
              <ChecklistLinkFields form={form} document={document} />
              <EditableExtractedFields title='Campos extraídos' form={form} />
            </div>
          )}

          {currentDecision === 'not_linked' && (
            <div className='flex flex-col gap-5'>
              <p className='font-sans text-xs text-muted-foreground'>
                O arquivo foi processado, mas não foi encontrado um vínculo seguro de caso
                ou checklist.
              </p>
              <div className='flex items-start gap-3 rounded-lg bg-highlight p-3'>
                <Icon name='help-circle' className='mt-0.5 size-4 text-primary' />
                <span className='font-sans text-xs font-medium text-foreground'>
                  Sem sugestão segura de caso. Selecione o vínculo manualmente.
                </span>
              </div>
              <ChecklistLinkFields form={form} document={document} isChecklistDisabled />
              <EditableExtractedFields title='Dados extraídos' form={form} />
            </div>
          )}

          {currentDecision === 'illegible' && <IllegibleDecisionState />}

          {currentDecision === 'incomplete' && (
            <div className='flex flex-col gap-5'>
              <p className='font-sans text-xs text-muted-foreground'>
                Faltam um ou mais campos obrigatórios antes da validação final.
              </p>
              <ChecklistLinkFields form={form} document={document} />
              <EditableExtractedFields title='Campos extraídos' form={form} />
              <Field data-invalid={Boolean(form.formState.errors.reason)}>
                <label
                  htmlFor='reason'
                  className='font-sans text-xs font-medium text-foreground'
                >
                  Motivo da recusa
                </label>
                <Textarea
                  id='reason'
                  className='mt-1 min-h-20 resize-none rounded-md bg-card font-sans text-sm'
                  placeholder='Ex.: documento sem verso ou sem data de emissão.'
                  {...form.register('reason')}
                />
                <FieldError>{form.formState.errors.reason?.message}</FieldError>
              </Field>
            </div>
          )}

          {currentDecision === 'duplicate' && (
            <div className='flex flex-col gap-5'>
              <p className='font-sans text-xs text-muted-foreground'>
                Foi encontrado um arquivo igual já recebido. Revise a
                correspondência antes de confirmar a duplicidade.
              </p>

              <input type='hidden' {...form.register('originalDocumentId')} />

              <div className='flex flex-col gap-3'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-sans text-sm font-semibold text-foreground'>
                    Vínculo do documento original
                  </h3>
                  <Badge
                    variant='secondary'
                    className='border-0 bg-highlight px-2 py-0.5 text-[10px] font-semibold text-primary'
                  >
                    Original validado
                  </Badge>
                </div>

                <div className='flex items-center gap-3 rounded-lg bg-muted/50 p-4'>
                  <div className='flex size-9 shrink-0 items-center justify-center rounded-md bg-card text-primary shadow-sm'>
                    <Icon name='link' className='size-4' />
                  </div>
                  <div className='flex flex-col gap-0.5'>
                    <span className='font-sans text-sm font-semibold text-foreground'>
                      {document.duplicateMatch?.caseLabel ?? 'Caso não informado'}
                    </span>
                    <span className='font-sans text-xs text-muted-foreground'>
                      {document.duplicateMatch?.checklistItemLabel ??
                        'Item do checklist não informado'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex flex-col gap-3'>
                <h3 className='font-sans text-sm font-semibold text-foreground'>
                  Possível duplicidade
                </h3>

                <div className='flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm'>
                  <div className='flex items-start gap-3'>
                    <Icon name='copy' className='mt-0.5 size-4 text-primary' />
                    <div className='flex flex-col gap-0.5'>
                      <span className='font-sans text-sm font-semibold text-foreground'>
                        {document.duplicateMatch?.fileName ?? 'Arquivo original'}
                      </span>
                      <span className='font-sans text-xs text-muted-foreground'>
                        {document.duplicateMatch
                          ? `Recebido em ${new Intl.DateTimeFormat('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }).format(new Date(document.duplicateMatch.receivedAt))}`
                          : 'Data de recebimento não informada'}
                      </span>
                    </div>
                  </div>

                  <div className='flex flex-col gap-1 rounded-md bg-muted/50 p-3 font-sans text-xs'>
                    <span className='font-medium text-foreground'>
                      {document.duplicateMatch?.caseLabel ?? 'Caso não informado'}
                    </span>
                    <span className='text-muted-foreground'>
                      {document.duplicateMatch?.checklistItemLabel ??
                        'Item do checklist não informado'}
                    </span>
                  </div>

                  <Button
                    type='button'
                    variant='outline'
                    className='h-9 w-full rounded-pill border-primary font-sans text-xs font-semibold text-primary hover:bg-highlight'
                    disabled={!document.duplicateMatch}
                    onClick={() =>
                      document.duplicateMatch &&
                      handleOpenDuplicateDocument(document.duplicateMatch.documentFileId)
                    }
                  >
                    <Icon name='external-link' className='size-3.5' />
                    Acessar documento original
                  </Button>
                </div>

                <div
                  className='flex items-start gap-2 rounded-md bg-muted/60 p-3'
                  role='note'
                >
                  <Icon name='info' className='mt-0.5 size-3.5 text-primary' />
                  <span className='font-sans text-[11px] text-muted-foreground'>
                    O documento atual não será vinculado novamente ao checklist. O
                    original permanecerá como referência.
                  </span>
                </div>
              </div>

              <Field data-invalid={Boolean(form.formState.errors.originalDocumentId)}>
                <FieldError>
                  {form.formState.errors.originalDocumentId?.message}
                </FieldError>
              </Field>
            </div>
          )}

          {currentDecision === 'mismatch' && (
            <div className='flex flex-col gap-5'>
              <p className='font-sans text-xs text-muted-foreground'>
                O arquivo não corresponde ao documento esperado para este item do
                checklist.
              </p>
              <ChecklistLinkFields form={form} document={document} />
              <Field data-invalid={Boolean(form.formState.errors.reason)}>
                <label
                  htmlFor='mismatchReason'
                  className='font-sans text-xs font-medium text-foreground'
                >
                  Divergência encontrada
                </label>
                <Textarea
                  id='mismatchReason'
                  className='mt-1 min-h-20 resize-none rounded-md bg-card font-sans text-sm'
                  placeholder='Descreva o motivo da não correspondência.'
                  {...form.register('reason')}
                />
                <FieldError>{form.formState.errors.reason?.message}</FieldError>
              </Field>
            </div>
          )}

          {currentDecision === 'escalate' && (
            <div className='flex flex-col gap-5'>
              <p className='font-sans text-xs text-muted-foreground'>
                Use esta decisão quando a análise depender de conferência jurídica antes
                da validação operacional.
              </p>
              <div className='flex items-start gap-3 rounded-lg bg-highlight p-3'>
                <Icon name='alert-circle' className='mt-0.5 size-4 text-primary' />
                <span className='font-sans text-xs font-medium text-foreground'>
                  Informe o motivo para encaminhar o documento a um advogado.
                </span>
              </div>
              <EditableExtractedFields title='Dados extraídos' form={form} />
              <Field data-invalid={Boolean(form.formState.errors.reason)}>
                <label
                  htmlFor='escalateReason'
                  className='font-sans text-xs font-medium text-foreground'
                >
                  Motivo do acionamento
                </label>
                <Textarea
                  id='escalateReason'
                  className='mt-1 min-h-20 resize-none rounded-md bg-card font-sans text-sm'
                  placeholder='Ex.: documento exige análise jurídica antes da validação.'
                  {...form.register('reason')}
                />
                <FieldError>{form.formState.errors.reason?.message}</FieldError>
              </Field>
            </div>
          )}
        </div>

        <footer className='mt-auto flex items-center justify-end gap-3 border-t border-border bg-card p-5'>
          {['illegible', 'incomplete'].includes(currentDecision) && (
            <Button
              type='button'
              variant='outline'
              className='rounded-pill font-sans text-sm font-medium gap-2 text-foreground h-11'
              onClick={onRequestResend}
              disabled={isSubmitting}
            >
              <Icon name='send' className='size-4' />
              Solicitar reenvio
            </Button>
          )}

          <Button
            type='submit'
            variant='brand'
            className='rounded-pill font-sans text-sm font-medium gap-2 h-11 px-6'
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Icon name='refresh-cw' className='size-4 animate-spin' />
            ) : currentDecision === 'validate' ? (
              <Icon name='check' className='size-4' />
            ) : (
              <Icon name='download' className='size-4' />
            )}
            {currentDecision === 'validate'
              ? 'Confirmar validação'
              : currentDecision === 'duplicate'
                ? 'Confirmar como duplicado'
                : 'Salvar decisão'}
          </Button>
        </footer>
      </form>
    </aside>
  )
}
