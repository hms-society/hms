import { forwardRef, useImperativeHandle } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Separator } from '@/ui/shadcn/separator'
import { Textarea } from '@/ui/shadcn/textarea'

import {
  NO_LEGAL_AREA_VALUE,
  useDemandStep,
} from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-demand-step'

export interface StepRef {
  validate: () => Promise<boolean>
}

export const StepDemand = forwardRef<StepRef>((_, ref) => {
  const { trigger } = useFormContext()
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

  useImperativeHandle(ref, () => ({
    validate: async () => {
      return await trigger(['origin', 'contactChannel', 'urgency'])
    },
  }))

  return (
    <div className='flex flex-col gap-5'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='origin'>
            Origem <span className='text-destructive'>*</span>
          </Label>
          <Controller
            name='origin'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger id='origin' className='w-full' size='sm'>
                  <SelectValue placeholder='Selecione a origem...' />
                </SelectTrigger>
                <SelectContent side='bottom' sideOffset={4} avoidCollisions={false}>
                  <SelectItem value='direct'>Entrada direta HMS</SelectItem>
                  <SelectItem value='referral'>Indicação</SelectItem>
                  <SelectItem value='website'>Site do HMS</SelectItem>
                  <SelectItem value='social_media'>Redes sociais</SelectItem>
                  <SelectItem value='other'>Outro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.origin && (
            <span className='text-[12px] text-destructive'>
              {errors.origin.message as string}
            </span>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='contactChannel'>
            Canal de contato <span className='text-destructive'>*</span>
          </Label>
          <Controller
            name='contactChannel'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger id='contactChannel' className='w-full' size='sm'>
                  <SelectValue placeholder='Selecione o canal de contato...' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='whatsapp'>WhatsApp</SelectItem>
                  <SelectItem value='email'>E-mail</SelectItem>
                  <SelectItem value='phone'>Telefone</SelectItem>
                  <SelectItem value='in_person'>Escritório / Presencial</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.contactChannel && (
            <span className='text-[12px] text-destructive'>
              {errors.contactChannel.message as string}
            </span>
          )}
        </div>
      </div>

      <Separator />
      <div className='grid grid-cols-3 gap-4'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='legalAreaId'>
            Área jurídica{' '}
            <span className='font-normal text-muted-foreground'>(opcional)</span>
          </Label>
          <Controller
            name='legalAreaId'
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={handleLegalAreaChange}
                value={field.value ?? ''}
                disabled={isLoadingLegalAreas}
              >
                <SelectTrigger id='legalAreaId' className='w-full' size='sm'>
                  <SelectValue
                    placeholder={
                      isLoadingLegalAreas
                        ? 'Carregando áreas...'
                        : 'Escolha a Área Jurídica'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_LEGAL_AREA_VALUE}>Nenhuma área</SelectItem>
                  {legalAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.legalAreaId && (
            <span className='text-[12px] text-destructive'>
              {errors.legalAreaId.message as string}
            </span>
          )}
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='legalTopicId'>
            Tema jurídico{' '}
            <span className='font-normal text-muted-foreground'>(opcional)</span>
          </Label>
          <Controller
            name='legalTopicId'
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ''}
                disabled={!selectedLegalAreaId || isLoadingLegalTopics}
              >
                <SelectTrigger id='legalTopicId' className='w-full' size='sm'>
                  <SelectValue
                    placeholder={
                      !selectedLegalAreaId
                        ? 'Escolha a área primeiro'
                        : isLoadingLegalTopics
                          ? 'Carregando temas...'
                          : 'Escolha o Tema Jurídico'
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
          {errors.legalTopicId && (
            <span className='text-[12px] text-destructive'>
              {errors.legalTopicId.message as string}
            </span>
          )}
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='urgency'>
            Grau de urgência <span className='text-destructive'>*</span>
          </Label>
          <Controller
            name='urgency'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger id='urgency' className='w-full' size='sm'>
                  <SelectValue placeholder='Selecione o Nível de Urgência' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='normal'>Normal</SelectItem>
                  <SelectItem value='high'>Alta</SelectItem>
                  <SelectItem value='urgent'>Urgente</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.urgency && (
            <span className='text-[12px] text-destructive'>
              {errors.urgency.message as string}
            </span>
          )}
        </div>
      </div>
      {legalCatalogError && (
        <span className='text-[12px] text-destructive'>
          Não foi possível carregar o catálogo jurídico. Tente novamente.
        </span>
      )}

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='notes'>
          Observações{' '}
          <span className='text-muted-foreground font-normal'>(opcional)</span>
        </Label>
        <Controller
          name='notes'
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id='notes'
              value={field.value ?? ''}
              placeholder='Relato do lead, anotações do atendente...'
              className='resize-none min-h-[140px]'
            />
          )}
        />
        {errors.notes && (
          <span className='text-[12px] text-destructive'>
            {errors.notes.message as string}
          </span>
        )}
      </div>
    </div>
  )
})

StepDemand.displayName = 'StepDemand'
