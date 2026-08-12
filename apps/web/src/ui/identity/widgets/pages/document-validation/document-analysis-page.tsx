import { Controller } from 'react-hook-form'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/ui/shadcn/field'
import { NativeSelect, NativeSelectOption } from '@/ui/shadcn/native-select'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useDocumentAnalysis } from './use-document-analysis'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

export type DocumentAnalysisPageProps = {
  fileId: string
}

export const DocumentAnalysisPage = ({ fileId }: DocumentAnalysisPageProps) => {
  const { 
    form, 
    currentDecision, 
    isSubmitting, 
    onSubmit,
    mockDocument,
  } = useDocumentAnalysis({ fileId })

  return (
    <div className="flex w-full flex-col mt-3">
        <Anchor
        route='documentInbox'
        className='inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground'
      >
        <Icon name='arrow-left' className='size-4' />
        Voltar
      </Anchor>
      <div className="grid h-[calc(100vh-130px)] grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] mt-5">
        <section className="flex h-full flex-col items-center justify-center rounded-xl border border-border bg-card shadow-card">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Icon name="file-text" className="size-16 opacity-40" />
            <span className="font-sans text-sm font-medium">Visualizador de PDF (react-pdf)</span>
          </div>
        </section>

        <aside className="flex h-full flex-col rounded-xl border border-border bg-card shadow-card">
          <header className="flex flex-col gap-2 border-b border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-xl font-semibold text-foreground">
                  Revisão de Documento
                </h1>
                <p className="mt-1 truncate font-sans text-sm text-muted-foreground">
                  {mockDocument.fileName}
                </p>
              </div>
              <Badge variant="success" className="shrink-0 rounded-pill">
                IA: {mockDocument.confidence}
              </Badge>
            </div>
          </header>

          <form
            onSubmit={onSubmit}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6"
            noValidate
          >
            <FieldGroup className="gap-6">
              <Field data-invalid={Boolean(form.formState.errors.decision)}>
                <FieldLabel htmlFor="decision" className="text-sm">Decisão da Revisão</FieldLabel>
                <Controller
                  name="decision"
                  control={form.control}
                  render={({ field }) => (
                    <NativeSelect id="decision" {...field} className="w-full font-sans">
                      <NativeSelectOption value="validate">Validar Classificação</NativeSelectOption>
                      <NativeSelectOption value="illegible">Rejeitar: Ilegível</NativeSelectOption>
                      <NativeSelectOption value="incomplete">Rejeitar: Incompleto</NativeSelectOption>
                      <NativeSelectOption value="duplicate">Sinalizar Duplicidade</NativeSelectOption>
                      <NativeSelectOption value="mismatch">Não Corresponde</NativeSelectOption>
                      <NativeSelectOption value="escalate">Acionar Advogado</NativeSelectOption>
                    </NativeSelect>
                  )}
                />
                <FieldError>{form.formState.errors.decision?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(form.formState.errors.documentTypeId)}>
                <FieldLabel htmlFor="documentTypeId" className="text-sm">Tipo Documental</FieldLabel>
                <Controller
                  name="documentTypeId"
                  control={form.control}
                  render={({ field }) => (
                    <NativeSelect id="documentTypeId" {...field} className="w-full font-sans">
                      <NativeSelectOption value="">Selecione o tipo...</NativeSelectOption>
                      <NativeSelectOption value="rg">RG / Identidade</NativeSelectOption>
                      <NativeSelectOption value="cnh">CNH</NativeSelectOption>
                      <NativeSelectOption value="comprovante_residencia">Comprovante de Residência</NativeSelectOption>
                      <NativeSelectOption value="contrato_social">Contrato Social</NativeSelectOption>
                      <NativeSelectOption value="extrato_bancario">Extrato Bancário</NativeSelectOption>
                      <NativeSelectOption value="declaracao_hipossuficiencia">Declaração de Hipossuficiência</NativeSelectOption>
                      <NativeSelectOption value="procuracao">Procuração</NativeSelectOption>
                    </NativeSelect>
                  )}
                />
                <FieldError>{form.formState.errors.documentTypeId?.message}</FieldError>
              </Field>

              {['incomplete', 'mismatch', 'escalate'].includes(currentDecision) && (
                <Field data-invalid={Boolean(form.formState.errors.reason)}>
                  <FieldLabel htmlFor="reason" className="text-sm">Motivo / Observação</FieldLabel>
                  <Controller
                    name="reason"
                    control={form.control}
                    render={({ field }) => (
                      <Textarea 
                        id="reason" 
                        {...field} 
                        rows={4} 
                        placeholder="Especifique o detalhe da rejeição ou a dúvida..." 
                        className="font-sans"
                      />
                    )}
                  />
                  <FieldError>{form.formState.errors.reason?.message}</FieldError>
                </Field>
              )}

              {currentDecision === 'duplicate' && (
                <Field data-invalid={Boolean(form.formState.errors.originalDocumentId)}>
                  <FieldLabel htmlFor="originalDocumentId" className="text-sm">Documento Original</FieldLabel>
                  <Controller
                    name="originalDocumentId"
                    control={form.control}
                    render={({ field }) => (
                      <NativeSelect id="originalDocumentId" {...field} className="w-full font-sans">
                        <NativeSelectOption value="">Selecione o arquivo original...</NativeSelectOption>
                        <NativeSelectOption value="doc-123">rg-frente-verso.pdf</NativeSelectOption>
                        <NativeSelectOption value="doc-456">comprovante-residencia-v1.pdf</NativeSelectOption>
                      </NativeSelect>
                    )}
                  />
                  <FieldError>{form.formState.errors.originalDocumentId?.message}</FieldError>
                </Field>
              )}
            </FieldGroup>

            <footer className="mt-auto flex flex-col gap-3 pt-8">
              <Button
                type="submit"
                variant="outline"
                className="w-full rounded-pill border-foreground text-foreground gap-2 hover:bg-muted"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Icon name="refresh-cw" className="size-4 animate-spin" />
                ) : (
                  <Icon name="check" className="size-4" />
                )}
                {isSubmitting ? 'Processando...' : 'Confirmar Decisão'}
              </Button>
            </footer>
          </form>
        </aside>
      </div>
    </div>
  )
}