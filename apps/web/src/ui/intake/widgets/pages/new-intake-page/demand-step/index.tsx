import { Controller } from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/shadcn/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Textarea } from '@/ui/shadcn/textarea'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useDemandStep } from './use-demand-step'

export const DemandStep = () => {
  const {
    control,
    errors,
    legalAreas,
    legalTopics,
    isLoadingLegalAreas,
    isLoadingLegalTopics,
    legalCatalogError,
    selectedLegalAreaId,
    handleLegalAreaChange,
  } = useDemandStep()

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <span className='flex size-9 items-center justify-center rounded-lg bg-secondary text-primary'>
            <Icon name='message-square-text' />
          </span>
          <div>
            <h2 className='font-sans text-base font-semibold text-foreground'>
              Dados da demanda
            </h2>
            <p className='text-sm text-muted-foreground'>
              Classifique o contato para orientar o atendimento.
            </p>
          </div>
        </div>
        <p className='text-xs text-muted-foreground'>* Campos obrigatórios</p>
      </div>

      <div className='grid gap-5 md:grid-cols-2'>
        <Field data-invalid={Boolean(errors.origin)}>
          <FieldLabel htmlFor='origin'>Origem *</FieldLabel>
          <Controller
            name='origin'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger
                  id='origin'
                  className='w-full'
                  aria-invalid={Boolean(errors.origin)}
                >
                  <SelectValue placeholder='Selecione a origem' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='direct'>Entrada direta HMS</SelectItem>
                  <SelectItem value='referral'>Indicação</SelectItem>
                  <SelectItem value='website'>Site do HMS</SelectItem>
                  <SelectItem value='social_media'>Redes sociais</SelectItem>
                  <SelectItem value='other'>Outro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.origin?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.contactChannel)}>
          <FieldLabel htmlFor='contact-channel'>Canal de contato *</FieldLabel>
          <Controller
            name='contactChannel'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger
                  id='contact-channel'
                  className='w-full'
                  aria-invalid={Boolean(errors.contactChannel)}
                >
                  <SelectValue placeholder='Selecione o canal' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='whatsapp'>WhatsApp</SelectItem>
                  <SelectItem value='email'>E-mail</SelectItem>
                  <SelectItem value='phone'>Telefone</SelectItem>
                  <SelectItem value='in_person'>Presencial</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.contactChannel?.message}</FieldError>
        </Field>
      </div>

      <div className='grid gap-5 border-t border-border pt-6 lg:grid-cols-3'>
        <Field data-invalid={Boolean(errors.legalAreaId)}>
          <FieldLabel htmlFor='legal-area'>Área jurídica *</FieldLabel>
          <Controller
            name='legalAreaId'
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={handleLegalAreaChange}
                disabled={isLoadingLegalAreas}
              >
                <SelectTrigger
                  id='legal-area'
                  className='w-full'
                  aria-invalid={Boolean(errors.legalAreaId)}
                >
                  <SelectValue
                    placeholder={
                      isLoadingLegalAreas ? 'Carregando áreas…' : 'Selecione a área'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {legalAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.legalAreaId?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.legalTopicId)}>
          <FieldLabel htmlFor='legal-topic'>Tema jurídico *</FieldLabel>
          <Controller
            name='legalTopicId'
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!selectedLegalAreaId}
              >
                <SelectTrigger
                  id='legal-topic'
                  className='w-full'
                  aria-invalid={Boolean(errors.legalTopicId)}
                >
                  <SelectValue
                    placeholder={
                      !selectedLegalAreaId
                        ? 'Escolha a área primeiro'
                        : isLoadingLegalTopics
                          ? 'Carregando temas…'
                          : 'Selecione o tema'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {legalTopics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.legalTopicId?.message}</FieldError>
        </Field>

        <Field data-invalid={Boolean(errors.urgency)}>
          <FieldLabel htmlFor='urgency'>Grau de urgência *</FieldLabel>
          <Controller
            name='urgency'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger
                  id='urgency'
                  className='w-full'
                  aria-invalid={Boolean(errors.urgency)}
                >
                  <SelectValue placeholder='Selecione a urgência' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='normal'>Normal</SelectItem>
                  <SelectItem value='high'>Alta</SelectItem>
                  <SelectItem value='urgent'>Urgente</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.urgency?.message}</FieldError>
        </Field>
      </div>

      {legalCatalogError && (
        <p role='alert' className='text-sm text-destructive'>
          Não foi possível carregar o catálogo jurídico. Tente novamente.
        </p>
      )}

      <Field data-invalid={Boolean(errors.notes)}>
        <FieldLabel htmlFor='notes'>Observações</FieldLabel>
        <FieldDescription>Opcional, até 2.000 caracteres.</FieldDescription>
        <Controller
          name='notes'
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id='notes'
              value={field.value ?? ''}
              placeholder='Relato do cliente e anotações relevantes para o atendimento'
              className='min-h-32 resize-y'
              aria-invalid={Boolean(errors.notes)}
            />
          )}
        />
        <FieldError>{errors.notes?.message}</FieldError>
      </Field>
    </div>
  )
}
