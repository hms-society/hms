import { Button } from '#/ui/shadcn/button'
import { Separator } from '#/ui/shadcn/separator'
import { Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { StepDemand } from './step-demand'
import { StepClient } from './step-client'
import { StepDecision } from './step-decision'

export const NovoIntake = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const steps = [
    { number: 1, label: 'Demanda' },
    { number: 2, label: 'Cliente' },
    { number: 3, label: 'Decisão' },
  ]

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground font-serif text-[20px] font-semibold">
          Novo intake
        </h1>
        <Button disabled={currentStep < 3} className="rounded-pill">
          <Check />
          Salvar intake
        </Button>
      </div>

      <div className="grid grid-cols-3 border-b border-border">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex items-center justify-center gap-2 py-3 border-b-2 transition-colors ${
              step.number === currentStep
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              step.number <= currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {step.number}
            </span>
            <span className="text-[14px] font-sans">{step.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-8">
        {currentStep === 1 && <StepDemand />}
        {currentStep === 2 && <StepClient />}
        {currentStep === 3 && <StepDecision />}
      </div>

      <Separator />

      <div className="flex justify-between">
        <Button
            variant="brand"
            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className="rounded-pill"
        >
            <ArrowLeft />
            Anterior
        </Button>
        {currentStep < 3 && (
            <Button
            variant="brand"
            onClick={() => setCurrentStep(prev => Math.min(prev + 1, 3))}
            className="rounded-pill"
            >
            Próximo
            <ArrowRight />
            </Button>
        )}
        </div>
      </div>
    
  )
}