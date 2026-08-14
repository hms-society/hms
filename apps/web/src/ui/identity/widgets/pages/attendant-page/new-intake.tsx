import { Button } from '@/ui/shadcn/button'
import { Separator } from '@/ui/shadcn/separator'
import { Check, ArrowRight, ArrowLeft, X, DoorOpen } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { StepClient } from './step-client'
import { StepDecision } from './step-decision'
import { intakeFullSchema, type IntakeFullData } from './schemas/intake-schema'
import { StepDemand } from './step-demand'
import type { StepRef } from './step-demand'

export const NovoIntake = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [tipoCard, setTipoCard] = useState<'agendar' | 'registrar'>('agendar')

  const step1Ref = useRef<StepRef>(null)
  const step2Ref = useRef<StepRef>(null)
  const step3Ref = useRef<StepRef>(null)

  const methods = useForm<IntakeFullData>({
    resolver: zodResolver(intakeFullSchema),
    mode: 'onChange',
    defaultValues: {
      origem: '',
      canal: '',
      areaJuridica: '',
      temaJuridico: '',
      urgencia: '',
      observacoes: '',
      clienteVinculado: false,
      tipoCard: 'agendar',
      modalidade: 'virtual',
      canalVirtual: 'whatsapp',
      local: '',
      advogado: '',
      data: new Date(),
      horario: '',
      motivo: '',
    },
  })
  const { reset } = methods

  const steps = [
    { number: 1, label: 'Demanda' },
    { number: 2, label: 'Cliente' },
    { number: 3, label: 'Decisão' },
  ]
  const handleResetForm = () => {
    reset()
    setTipoCard('agendar')
    setCurrentStep(1)
  }
  const handleNext = async () => {
    let isValid = false

    if (currentStep === 1) {
      isValid = (await step1Ref.current?.validate()) ?? false
    } else if (currentStep === 2) {
      isValid = (await step2Ref.current?.validate()) ?? false
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const handleSave = async () => {
    const isValid = await step3Ref.current?.validate()
    if (isValid) {
      const data = methods.getValues()
      console.log('Dados salvos com sucesso:', data)
      setCurrentStep(1)
      handleResetForm()
    }
  }

  return (
    <FormProvider {...methods}>
      <div className='min-h-screen bg-background p-8 flex flex-col gap-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-foreground font-serif text-[20px] font-semibold'>
            Novo intake
          </h1>
          <div className='flex items-center gap-2'>
            {currentStep === 3 && tipoCard === 'agendar' && (
              <Button variant='brand' className='rounded-pill' onClick={handleResetForm}>
                <X />
                Cancelar
              </Button>
            )}
            <Button
              disabled={currentStep < 3}
              onClick={handleSave}
              className={`rounded-pill ${
                tipoCard === 'registrar' && currentStep === 3
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : ''
              }`}
            >
              {tipoCard === 'registrar' && currentStep === 3 ? (
                <>
                  <DoorOpen />
                  Encerrar atendimento
                </>
              ) : (
                <>
                  <Check />
                  Salvar intake
                </>
              )}
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-3 border-b border-border'>
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
                step.number === currentStep
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step.number <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.number}
              </span>
              <span className='text-[14px] font-sans'>{step.label}</span>
            </div>
          ))}
        </div>

        <div className='bg-card rounded-xl p-8'>
          <div className={currentStep === 1 ? 'block' : 'hidden'}>
            <StepDemand ref={step1Ref} />
          </div>
          <div className={currentStep === 2 ? 'block' : 'hidden'}>
            <StepClient ref={step2Ref} />
          </div>
          <div className={currentStep === 3 ? 'block' : 'hidden'}>
            <StepDecision ref={step3Ref} tipoCard={tipoCard} setTipoCard={setTipoCard} />
          </div>
        </div>

        <Separator />

        <div className='flex justify-between'>
          <Button
            variant='brand'
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className='rounded-pill'
          >
            <ArrowLeft />
            Anterior
          </Button>
          {currentStep < 3 && (
            <Button variant='brand' onClick={handleNext} className='rounded-pill'>
              Próximo
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </FormProvider>
  )
}
