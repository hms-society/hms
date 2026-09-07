import { useState } from 'react'
import type { DynamicFormAnswerValue, DynamicFormField } from '@hms/core/shared/domain'

import { DynamicFormFieldsSection } from '@/ui/shared/widgets/dynamic-form/dynamic-form-fields'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'

import { CloseFormConfirmationDialog } from './close-form-confirmation-dialog'
import { ReopenFormConfirmationDialog } from './reopen-form-confirmation-dialog'
import { useCommercialConditionsCard } from './use-commercial-conditions-card'

export function CommercialConditionsCard({
  fields,
  answers,
  isClosed,
  isReadOnly = false,
  isPending,
  error,
  expectedVersion,
  onChange,
  onSaveDraft,
  onClose,
  onReopen,
  formName,
  onOpenSelect,
  canReplace = false,
}: {
  fields: readonly DynamicFormField[]
  answers: Readonly<Record<string, DynamicFormAnswerValue>>
  isClosed: boolean
  isReadOnly?: boolean
  isPending: boolean
  error?: Error | null
  expectedVersion: number
  onChange: (fieldId: string, value: DynamicFormAnswerValue) => void
  onSaveDraft: (
    expectedVersion: number,
    answers: ReturnType<typeof useCommercialConditionsCard>['answerList'],
  ) => void
  onClose: (
    expectedVersion: number,
    answers: ReturnType<typeof useCommercialConditionsCard>['answerList'],
  ) => void
  onReopen: (expectedVersion: number) => void
  formName: string
  onOpenSelect: () => void
  canReplace?: boolean
}) {
  const form = useCommercialConditionsCard(fields, answers)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isReopenDialogOpen, setIsReopenDialogOpen] = useState(false)

  function handleRequestClose() {
    if (form.validate()) setIsCloseDialogOpen(true)
  }

  return (
    <>
      <Card className='border border-border shadow-sm'>
        <CardContent className='space-y-5 p-5 sm:p-6'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
                Condições comerciais
              </p>
              <h2 className='mt-1 font-serif text-xl font-semibold text-foreground'>
                {formName}
              </h2>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              {canReplace && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onOpenSelect}
                  disabled={isPending}
                >
                  Trocar ficha
                </Button>
              )}
              <Badge variant={isClosed ? 'success' : 'info'}>
                {isClosed ? 'Fechada' : 'Aberta'}
              </Badge>
              <Badge
                variant={
                  form.completion.answeredCount === form.completion.requiredCount
                    ? 'success'
                    : 'attention'
                }
                aria-label={`${form.completion.answeredCount} de ${form.completion.requiredCount} campos obrigatórios preenchidos`}
              >
                {form.completion.answeredCount} de {form.completion.requiredCount}{' '}
                obrigatórios
              </Badge>
            </div>
          </div>
          <DynamicFormFieldsSection
            fields={fields}
            answers={answers}
            errors={form.errors}
            onChange={onChange}
            isReadOnly={isReadOnly || isClosed || isPending}
          />
          <div className='flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end'>
            {isClosed ? (
              <Button
                variant='outline'
                onClick={() => setIsReopenDialogOpen(true)}
                disabled={isReadOnly || isPending}
              >
                Reabrir formulário
              </Button>
            ) : (
              <>
                <Button
                  variant='outline'
                  onClick={() => onSaveDraft(expectedVersion, form.answerList)}
                  disabled={isReadOnly || isPending}
                >
                  Salvar rascunho
                </Button>
                <Button onClick={handleRequestClose} disabled={isReadOnly || isPending}>
                  Fechar formulário
                </Button>
              </>
            )}
          </div>
          {error && (
            <p role='alert' className='text-sm text-destructive'>
              {error.message}
            </p>
          )}
        </CardContent>
      </Card>
      <CloseFormConfirmationDialog
        open={isCloseDialogOpen}
        isPending={isPending}
        onOpenChange={setIsCloseDialogOpen}
        onConfirm={() => onClose(expectedVersion, form.answerList)}
      />
      <ReopenFormConfirmationDialog
        open={isReopenDialogOpen}
        isPending={isPending}
        onOpenChange={setIsReopenDialogOpen}
        onConfirm={() => onReopen(expectedVersion)}
      />
    </>
  )
}
