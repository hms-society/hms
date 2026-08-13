import { Controller, type UseFormReturn } from 'react-hook-form'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Field, FieldError } from '@/ui/shadcn/field'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { IllegibleDecisionState } from './illegible-decision-state'
import type { DocumentReviewFormData } from '../../pages/document-validation/schemas/schema'

export type AnalysisFormPanelProps = {
  form: UseFormReturn<DocumentReviewFormData>
  currentDecision: string
  isSubmitting: boolean
  confidence: string
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  onRequestResend: () => void
}

export const AnalysisFormPanel = ({
  form,
  currentDecision,
  isSubmitting,
  confidence,
  onSubmit,
  onRequestResend,
}: AnalysisFormPanelProps) => {
  return (
    <aside className="flex flex-col bg-card">
      <form onSubmit={onSubmit} className="flex h-full flex-col" noValidate>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-sm font-semibold text-foreground">
              Resultado da validação
            </h2>
            <Badge variant="secondary" className="gap-1 bg-[#E1F5F6] text-[#0F5C61] px-2 py-0.5 text-[10px] font-semibold border-0">
              <Icon name="scan" className="size-3" />
              {confidence}
            </Badge>
          </div>

          <Field data-invalid={Boolean(form.formState.errors.decision)}>
            <Controller
              name="decision"
              control={form.control}
              render={({ field }) => (
                <NativeSelect id="decision" {...field} className="w-full font-sans text-sm h-12">
                  <NativeSelectOption value="validate">Validar Classificação</NativeSelectOption>
                  <NativeSelectOption value="illegible">Ilegível</NativeSelectOption>
                  <NativeSelectOption value="incomplete">Incompleto</NativeSelectOption>
                  <NativeSelectOption value="duplicate">Duplicado</NativeSelectOption>
                  <NativeSelectOption value="mismatch">Não Corresponde</NativeSelectOption>
                  <NativeSelectOption value="escalate">Acionar Advogado</NativeSelectOption>
                </NativeSelect>
              )}
            />
            <FieldError>{form.formState.errors.decision?.message}</FieldError>
          </Field>

          {currentDecision === 'illegible' && <IllegibleDecisionState />}
          
        </div>

        <footer className="mt-auto flex items-center justify-end gap-3 border-t border-border bg-card p-5">
          {currentDecision === 'illegible' && (
            <Button
              type="button"
              variant="outline"
              className="rounded-pill font-sans text-sm font-medium gap-2 text-foreground h-11"
              onClick={onRequestResend}
              disabled={isSubmitting}
            >
              <Icon name="send" className="size-4" />
              Solicitar reenvio
            </Button>
          )}
          
          <Button
            type="submit"
            variant="brand"
            className="rounded-pill font-sans text-sm font-medium gap-2 h-11 px-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Icon name="refresh-cw" className="size-4 animate-spin" />
            ) : (
              <Icon name="check" className="size-4" />
            )}
            Salvar decisão
          </Button>
        </footer>
      </form>
    </aside>
  )
}