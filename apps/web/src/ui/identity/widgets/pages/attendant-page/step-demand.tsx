import { forwardRef, useImperativeHandle } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Textarea } from '@/ui/shadcn/textarea'
import { Label } from '@/ui/shadcn/label'
import { Separator } from '@/ui/shadcn/separator'
import type { IntakeFullData } from './schemas/intake-schema'

export interface StepRef {
  validate: () => Promise<boolean>
}

export const StepDemand = forwardRef<StepRef>((_, ref) => {
  const {
    control,
    trigger,
    formState: { errors },
  } = useFormContext<IntakeFullData>()

  useImperativeHandle(ref, () => ({
    validate: async () => {
      return await trigger([
        'origem',
        'canal',
        'areaJuridica',
        'temaJuridico',
        'urgencia',
      ])
    },
  }))

  return (
    <div className='flex flex-col gap-5'>
      <div className='grid grid-cols-2 gap-4'>
        <div className='flex flex-col gap-1.5'>
          <Label>
            Origem <span className='text-destructive'>*</span>
          </Label>
          <Controller
            name='origem'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecione a origem...' />
                </SelectTrigger>
                <SelectContent side='bottom' sideOffset={4} avoidCollisions={false}>
                  <SelectItem value='entrada-direta'>Entrada direta HMS</SelectItem>
                  <SelectItem value='indicacao'>Indicação</SelectItem>
                  <SelectItem value='site'>Site do HMS</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.origem && (
            <span className='text-[12px] text-destructive'>{errors.origem.message}</span>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <Label>
            Canal de contato <span className='text-destructive'>*</span>
          </Label>
          <Controller
            name='canal'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecione o canal de contato...' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='whatsapp'>WhatsApp</SelectItem>
                  <SelectItem value='email'>E-mail</SelectItem>
                  <SelectItem value='telefone'>Telefone</SelectItem>
                  <SelectItem value='escritorio'>Escritório</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.canal && (
            <span className='text-[12px] text-destructive'>{errors.canal.message}</span>
          )}
        </div>
      </div>

      <Separator />

      <div className='grid grid-cols-3 gap-4'>
        <div className='flex flex-col gap-1.5'>
          <Label>
            Área jurídica <span className='text-destructive'>*</span>
          </Label>
          <Controller
            name='areaJuridica'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Escolha a Área Jurídica' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='administrativo'>Direito Administrativo</SelectItem>
                  <SelectItem value='ambiental'>Direito Ambiental</SelectItem>
                  <SelectItem value='civil'>Direito Civil</SelectItem>
                  <SelectItem value='consumidor'>Direito do Consumidor</SelectItem>
                  <SelectItem value='empresarial'>Direito Empresarial</SelectItem>
                  <SelectItem value='familia'>Direito de Família</SelectItem>
                  <SelectItem value='penal'>Direito Penal</SelectItem>
                  <SelectItem value='previdenciario'>Direito Previdenciário</SelectItem>
                  <SelectItem value='tributario'>Direito Tributário</SelectItem>
                  <SelectItem value='trabalhista'>Direito Trabalhista</SelectItem>
                  <SelectItem value='constitucional'>Direito Constitucional</SelectItem>
                  <SelectItem value='financeiro'>Direito Financeiro</SelectItem>
                  <SelectItem value='outro'>Outro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.areaJuridica && (
            <span className='text-[12px] text-destructive'>
              {errors.areaJuridica.message}
            </span>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <Label>
            Tema jurídico <span className='text-destructive'>*</span>
          </Label>
          <Controller
            name='temaJuridico'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Escolha o Tema Jurídico' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='verbas_rescisorias'>Verbas rescisórias</SelectItem>
                  <SelectItem value='assedio_moral'>Assédio moral</SelectItem>
                  <SelectItem value='demissao_sem_justa_causa'>
                    Demissão sem justa causa
                  </SelectItem>
                  <SelectItem value='horas_extras'>Horas extras</SelectItem>
                  <SelectItem value='acidente_de_trabalho'>
                    Acidente de trabalho
                  </SelectItem>
                  <SelectItem value='divorcio'>Divórcio</SelectItem>
                  <SelectItem value='inventario'>Inventário</SelectItem>
                  <SelectItem value='aposentadoria'>Aposentadoria</SelectItem>
                  <SelectItem value='outro'>Outro</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.temaJuridico && (
            <span className='text-[12px] text-destructive'>
              {errors.temaJuridico.message}
            </span>
          )}
        </div>

        <div className='flex flex-col gap-1.5'>
          <Label>
            Grau de urgência <span className='text-destructive'>*</span>
          </Label>
          <Controller
            name='urgencia'
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Selecione o Nível de Urgência' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='normal'>Normal</SelectItem>
                  <SelectItem value='urgente'>Urgente</SelectItem>
                  <SelectItem value='critico'>Crítico</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.urgencia && (
            <span className='text-[12px] text-destructive'>
              {errors.urgencia.message}
            </span>
          )}
        </div>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label>
          Observações{' '}
          <span className='text-muted-foreground font-normal'>(opcional)</span>
        </Label>
        <Controller
          name='observacoes'
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              value={field.value ?? ''}
              placeholder='Relato do lead, anotações do atendente...'
              className='resize-none min-h-[140px]'
            />
          )}
        />
      </div>
    </div>
  )
})

StepDemand.displayName = 'StepDemand'
