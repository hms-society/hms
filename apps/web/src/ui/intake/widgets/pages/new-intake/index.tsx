import { zodResolver } from '@hookform/resolvers/zod'
import type { IntakeDemandDraft } from '@hms/core/intake/domain/structures'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  ListChecks,
  MessageSquareText,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '#/ui/shadcn/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/ui/shadcn/field'
import { NativeSelect, NativeSelectOption } from '#/ui/shadcn/native-select'
import { Textarea } from '#/ui/shadcn/textarea'
import { AuthenticatedLayout } from '#/ui/shared/widgets/layouts/authenticated-layout'

const demandDraftStorageKey = 'hms:new-intake:demand-draft'

const demandSchema = z.object({
  origin: z.enum(['direct', 'referral', 'website', 'social_media', 'other'], {
    error: 'Selecione a origem do contato.',
  }),
  contactChannel: z.enum(['whatsapp', 'email', 'phone', 'in_person'], {
    error: 'Selecione o canal de contato.',
  }),
  legalArea: z.string().min(1, 'Selecione a área jurídica.'),
  legalTopic: z.string().min(1, 'Selecione o tema jurídico.'),
  urgency: z.enum(['normal', 'high', 'urgent'], {
    error: 'Selecione o grau de urgência.',
  }),
  notes: z.string().trim().max(2000, 'Use no máximo 2.000 caracteres.').optional(),
})

type DemandForm = z.infer<typeof demandSchema>

const legalTopics = {
  labor: [
    { value: 'termination_pay', label: 'Verbas rescisórias' },
    { value: 'employment_relationship', label: 'Vínculo empregatício' },
    { value: 'workplace_harassment', label: 'Assédio no trabalho' },
  ],
  civil: [
    { value: 'contracts', label: 'Contratos' },
    { value: 'civil_liability', label: 'Responsabilidade civil' },
    { value: 'consumer_relations', label: 'Relações de consumo' },
  ],
  family: [
    { value: 'divorce', label: 'Divórcio' },
    { value: 'child_support', label: 'Alimentos' },
    { value: 'custody', label: 'Guarda e convivência' },
  ],
  social_security: [
    { value: 'retirement', label: 'Aposentadoria' },
    { value: 'disability_benefit', label: 'Benefício por incapacidade' },
    { value: 'benefit_review', label: 'Revisão de benefício' },
  ],
} as const

const defaultValues: DemandForm = {
  origin: 'direct',
  contactChannel: 'whatsapp',
  legalArea: '',
  legalTopic: '',
  urgency: 'normal',
  notes: '',
}

const steps = ['Demanda', 'Cliente', 'Decisão'] as const

export const NewIntakePage = () => {
  const [demandSaved, setDemandSaved] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DemandForm>({
    resolver: zodResolver(demandSchema),
    defaultValues,
  })

  const selectedArea = watch('legalArea') as keyof typeof legalTopics | ''
  const availableTopics = selectedArea ? legalTopics[selectedArea] : []

  useEffect(() => {
    const savedDraft = sessionStorage.getItem(demandDraftStorageKey)

    if (savedDraft) {
      try {
        const parsedDraft = demandSchema.safeParse(JSON.parse(savedDraft))

        if (parsedDraft.success) {
          reset(parsedDraft.data)
          return
        }
      } catch {
        // Invalid session data is discarded below.
      }

      sessionStorage.removeItem(demandDraftStorageKey)
    }
  }, [reset])

  const handleAreaChange = (area: string) => {
    setValue('legalArea', area, { shouldValidate: true })
    setValue('legalTopic', '')
  }

  const saveDemandDraft = (values: DemandForm) => {
    const draft = values satisfies IntakeDemandDraft
    sessionStorage.setItem(demandDraftStorageKey, JSON.stringify(draft))
    setDemandSaved(true)
  }

  return (
    <AuthenticatedLayout>
      <div className='mx-auto flex w-full max-w-6xl flex-col gap-5'>
        <Link
          to='/intakes'
          className='inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary outline-none hover:text-brand focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50'
        >
          <ArrowLeft aria-hidden='true' className='size-4' />
          Intakes
        </Link>

        <header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-medium text-foreground'>Registrar demanda</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              Informe como o cliente chegou e o assunto do atendimento.
            </p>
          </div>
          <div className='inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground'>
            <ListChecks aria-hidden='true' className='size-4 text-primary' />
            Etapa 1 de 3
          </div>
        </header>

        <ol
          className='grid grid-cols-3 border-b border-border'
          aria-label='Etapas do novo Intake'
        >
          {steps.map((step, index) => {
            const isActive = index === 0
            return (
              <li
                key={step}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center gap-2 px-2 py-3 text-sm font-medium sm:px-5 ${
                  isActive
                    ? 'border-b-2 border-brand text-brand'
                    : 'text-muted-foreground'
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                    isActive
                      ? 'border-brand bg-brand text-brand-foreground'
                      : 'border-input'
                  }`}
                >
                  {index + 1}
                </span>
                <span className='hidden sm:inline'>{step}</span>
              </li>
            )
          })}
        </ol>

        <form onSubmit={handleSubmit(saveDemandDraft)} noValidate>
          <section className='rounded-xl border border-border bg-card p-5 sm:p-6'>
            <div className='flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-3'>
                <span className='flex size-9 items-center justify-center rounded-lg bg-secondary text-primary'>
                  <MessageSquareText aria-hidden='true' className='size-4' />
                </span>
                <div>
                  <h2 className='font-sans text-sm font-semibold'>Dados da demanda</h2>
                  <p className='text-xs text-muted-foreground'>
                    Classifique o contato para orientar o atendimento.
                  </p>
                </div>
              </div>
              <p className='text-xs text-muted-foreground'>* Campos obrigatórios</p>
            </div>

            <FieldGroup className='mt-5 gap-5'>
              <div className='grid gap-5 md:grid-cols-2'>
                <Field data-invalid={Boolean(errors.origin)}>
                  <FieldLabel htmlFor='origin'>Origem *</FieldLabel>
                  <NativeSelect
                    id='origin'
                    className='w-full'
                    aria-invalid={Boolean(errors.origin)}
                    {...register('origin')}
                  >
                    <NativeSelectOption value='direct'>
                      Entrada direta HMS
                    </NativeSelectOption>
                    <NativeSelectOption value='referral'>Indicação</NativeSelectOption>
                    <NativeSelectOption value='website'>Site</NativeSelectOption>
                    <NativeSelectOption value='social_media'>
                      Redes sociais
                    </NativeSelectOption>
                    <NativeSelectOption value='other'>Outro</NativeSelectOption>
                  </NativeSelect>
                  <FieldError>{errors.origin?.message}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.contactChannel)}>
                  <FieldLabel htmlFor='contactChannel'>Canal de contato *</FieldLabel>
                  <NativeSelect
                    id='contactChannel'
                    className='w-full'
                    aria-invalid={Boolean(errors.contactChannel)}
                    {...register('contactChannel')}
                  >
                    <NativeSelectOption value='whatsapp'>WhatsApp</NativeSelectOption>
                    <NativeSelectOption value='email'>E-mail</NativeSelectOption>
                    <NativeSelectOption value='phone'>Telefone</NativeSelectOption>
                    <NativeSelectOption value='in_person'>Presencial</NativeSelectOption>
                  </NativeSelect>
                  <FieldError>{errors.contactChannel?.message}</FieldError>
                </Field>
              </div>

              <div className='border-t border-border pt-5'>
                <div className='grid gap-5 md:grid-cols-3'>
                  <Field data-invalid={Boolean(errors.legalArea)}>
                    <FieldLabel htmlFor='legalArea'>Área jurídica *</FieldLabel>
                    <NativeSelect
                      id='legalArea'
                      className='w-full'
                      value={selectedArea}
                      aria-invalid={Boolean(errors.legalArea)}
                      onChange={(event) => handleAreaChange(event.target.value)}
                    >
                      <NativeSelectOption value=''>Selecione uma área</NativeSelectOption>
                      <NativeSelectOption value='labor'>Trabalhista</NativeSelectOption>
                      <NativeSelectOption value='civil'>Cível</NativeSelectOption>
                      <NativeSelectOption value='family'>Família</NativeSelectOption>
                      <NativeSelectOption value='social_security'>
                        Previdenciário
                      </NativeSelectOption>
                    </NativeSelect>
                    <FieldError>{errors.legalArea?.message}</FieldError>
                  </Field>

                  <Field data-invalid={Boolean(errors.legalTopic)}>
                    <FieldLabel htmlFor='legalTopic'>Tema jurídico *</FieldLabel>
                    <NativeSelect
                      id='legalTopic'
                      className='w-full'
                      aria-invalid={Boolean(errors.legalTopic)}
                      disabled={!selectedArea}
                      {...register('legalTopic')}
                    >
                      <NativeSelectOption value=''>
                        {selectedArea ? 'Selecione um tema' : 'Selecione a área primeiro'}
                      </NativeSelectOption>
                      {availableTopics.map((topic) => (
                        <NativeSelectOption key={topic.value} value={topic.value}>
                          {topic.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldError>{errors.legalTopic?.message}</FieldError>
                  </Field>

                  <Field data-invalid={Boolean(errors.urgency)}>
                    <FieldLabel htmlFor='urgency'>Grau de urgência *</FieldLabel>
                    <NativeSelect
                      id='urgency'
                      className='w-full'
                      aria-invalid={Boolean(errors.urgency)}
                      {...register('urgency')}
                    >
                      <NativeSelectOption value='normal'>Normal</NativeSelectOption>
                      <NativeSelectOption value='high'>Alta</NativeSelectOption>
                      <NativeSelectOption value='urgent'>Urgente</NativeSelectOption>
                    </NativeSelect>
                    <FieldError>{errors.urgency?.message}</FieldError>
                  </Field>
                </div>
              </div>

              <Field data-invalid={Boolean(errors.notes)}>
                <FieldLabel htmlFor='notes'>
                  Observações{' '}
                  <span className='font-normal text-muted-foreground'>(opcional)</span>
                </FieldLabel>
                <Textarea
                  id='notes'
                  rows={4}
                  maxLength={2000}
                  placeholder='Relato do cliente, anotações do atendente...'
                  aria-invalid={Boolean(errors.notes)}
                  {...register('notes')}
                />
                <FieldDescription>
                  Não inclua conclusões jurídicas nesta etapa.
                </FieldDescription>
                <FieldError>{errors.notes?.message}</FieldError>
              </Field>
            </FieldGroup>
          </section>

          <footer className='mt-5 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between'>
            <div aria-live='polite'>
              {demandSaved && (
                <p className='flex items-center gap-2 text-sm font-medium text-highlight-foreground'>
                  <Check aria-hidden='true' className='size-4' />
                  Demanda salva no rascunho desta sessão.
                </p>
              )}
            </div>
            <Button
              type='submit'
              variant='outline'
              size='lg'
              disabled={isSubmitting}
              className='rounded-full border-primary px-5 text-primary hover:bg-secondary'
            >
              Próximo
              <ArrowRight aria-hidden='true' />
            </Button>
          </footer>
        </form>

        <aside className='sr-only' aria-label='Regra de persistência'>
          <ClipboardList />O Intake ainda não foi criado. Somente o rascunho local da
          demanda foi salvo.
        </aside>
      </div>
    </AuthenticatedLayout>
  )
}
