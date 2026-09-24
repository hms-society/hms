import { useState } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'

type NewPieceDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerated: () => void
}

type Step = 1 | 2 | 3

const MODELS = [
  {
    id: 'retirement',
    title: 'Requerimento Administrativo de Aposentadoria — Modelo Universal',
    description: 'Modelo previdenciário reutilizável para requerimento administrativo.',
    version: 'Disponível para produção jurídica',
  },
  {
    id: 'age-retirement',
    title: 'Requerimento Administrativo — Aposentadoria por Idade',
    description: 'Requerimento inicial baseado em requisito etário.',
    version: 'v3 · atualizado 12/06',
  },
  {
    id: 'appeal',
    title: 'Recurso Administrativo INSS',
    description: 'Recurso contra indeferimento em primeira instância administrativa.',
    version: 'v1 · atualizado 08/05',
  },
]

const DOCUMENTS = [
  {
    id: 'rg',
    label: 'RG — Documento de Identidade',
    detail: 'Emitido em 2003 · válido',
    category: 'Identificação',
  },
  {
    id: 'cpf',
    label: 'CPF — Cadastro de Pessoa Física',
    detail: 'Situação regular',
    category: 'Identificação',
  },
  {
    id: 'address',
    label: 'Comprovante de Residência',
    detail: 'Conta de luz · abril/2026',
    category: 'Endereço',
  },
  {
    id: 'cnis',
    label: 'CNIS — Cadastro Nacional de Informações Sociais',
    detail: 'Filiação 12/03/1989 · 342 a 2 m',
    category: 'Previdenciário',
  },
]

export function NewPieceDialog({ open, onOpenChange, onGenerated }: NewPieceDialogProps) {
  const [step, setStep] = useState<Step>(1)
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id)
  const [modelSearch, setModelSearch] = useState('')
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [observations, setObservations] = useState('')

  const selectedModel = MODELS.find((model) => model.id === selectedModelId) ?? MODELS[0]
  const filteredModels = MODELS.filter((model) =>
    `${model.title} ${model.description}`
      .toLocaleLowerCase('pt-BR')
      .includes(modelSearch.trim().toLocaleLowerCase('pt-BR')),
  )

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setStep(1)
      setSelectedModelId(MODELS[0].id)
      setModelSearch('')
      setSelectedDocumentIds([])
      setObservations('')
    }
    onOpenChange(nextOpen)
  }

  function handleChangeModel() {
    setModelSearch('')
    setStep(1)
  }

  function handleToggleDocument(documentId: string) {
    setSelectedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[640px]'>
        <DialogHeader>
          <p className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
            Nova peça
          </p>
          <DialogTitle>
            {step === 1
              ? 'Escolha o modelo'
              : step === 2
                ? 'Preparar geração'
                : 'Gerando a minuta...'}
          </DialogTitle>
          <DialogDescription className='sr-only'>
            Fluxo de criação de uma nova peça jurídica.
          </DialogDescription>
          <div className='flex items-center gap-2 pt-2 text-xs text-muted-foreground'>
            <StepLabel
              active={step >= 1}
              current={step === 1}
              label='Modelo'
              number='1'
            />
            <span className='h-px w-8 bg-border' />
            <StepLabel
              active={step >= 2}
              current={step === 2}
              label='Preparação'
              number='2'
            />
            <span className='h-px w-8 bg-border' />
            <StepLabel
              active={step >= 3}
              current={step === 3}
              label='Geração'
              number='3'
            />
          </div>
        </DialogHeader>

        {step === 1 ? (
          <ModelStep
            models={filteredModels}
            search={modelSearch}
            selectedModelId={selectedModelId}
            onSearch={setModelSearch}
            onSelect={setSelectedModelId}
          />
        ) : null}
        {step === 2 ? (
          <PreparationStep
            model={selectedModel}
            selectedDocumentIds={selectedDocumentIds}
            onToggleDocument={handleToggleDocument}
            onChangeModel={handleChangeModel}
            observations={observations}
            onObservationsChange={setObservations}
          />
        ) : null}
        {step === 3 ? <GenerationStep /> : null}

        <DialogFooter className='gap-2 sm:justify-between'>
          {step === 1 ? (
            <Button variant='ghost' onClick={() => handleClose(false)}>
              Cancelar
            </Button>
          ) : step === 2 ? (
            <Button variant='outline' onClick={() => setStep(1)}>
              <Icon name='arrow-left' /> Voltar
            </Button>
          ) : (
            <Button variant='ghost' onClick={() => handleClose(false)}>
              Cancelar geração
            </Button>
          )}
          {step === 1 ? (
            <Button
              disabled={!selectedModelId || filteredModels.length === 0}
              onClick={() => setStep(2)}
            >
              Próximo <Icon name='arrow-right' />
            </Button>
          ) : null}
          {step === 2 ? (
            <Button disabled onClick={() => setStep(3)}>
              <Icon name='sparkles' /> Geração com IA indisponível
            </Button>
          ) : null}
          {step === 3 ? (
            <Button
              onClick={() => {
                handleClose(false)
                onGenerated()
              }}
            >
              Voltar para peças
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StepLabel({
  active,
  current,
  label,
  number,
}: {
  active: boolean
  current: boolean
  label: string
  number: string
}) {
  return (
    <span className={`flex items-center gap-1.5 ${active ? 'text-primary' : ''}`}>
      <span
        className={`flex size-5 items-center justify-center rounded-full text-[10px] ${current ? 'bg-primary text-primary-foreground' : active ? 'bg-highlight' : 'bg-muted'}`}
      >
        {active && !current ? <Icon name='check' className='size-3' /> : number}
      </span>
      {label}
    </span>
  )
}

function ModelStep({
  models,
  search,
  selectedModelId,
  onSearch,
  onSelect,
}: {
  models: typeof MODELS
  search: string
  selectedModelId: string
  onSearch: (value: string) => void
  onSelect: (id: string) => void
}) {
  return (
    <div className='space-y-3'>
      <div className='relative'>
        <Icon
          name='search'
          className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
        />
        <input
          aria-label='Buscar modelo por nome'
          className='h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
          placeholder='Buscar modelo por nome...'
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
      </div>
      <div className='space-y-2'>
        {models.length === 0 ? (
          <p className='rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground'>
            Nenhum modelo encontrado.
          </p>
        ) : null}
        {models.map((model) => (
          <button
            key={model.id}
            type='button'
            onClick={() => onSelect(model.id)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedModelId === model.id ? 'border-primary bg-highlight' : 'border-border hover:bg-muted/50'}`}
          >
            <div className='flex items-start gap-3'>
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${selectedModelId === model.id ? 'border-primary bg-primary' : 'border-input'}`}
              >
                {selectedModelId === model.id ? (
                  <span className='size-1.5 rounded-full bg-primary-foreground' />
                ) : null}
              </span>
              <span className='min-w-0'>
                <span className='block text-sm font-semibold text-foreground'>
                  {model.title}
                </span>
                <span className='mt-1 block text-xs text-muted-foreground'>
                  {model.description}
                </span>
                <span className='mt-1 block text-[11px] text-muted-foreground'>
                  {model.version}
                </span>
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function PreparationStep({
  model,
  selectedDocumentIds,
  onToggleDocument,
  onChangeModel,
  observations,
  onObservationsChange,
}: {
  model: (typeof MODELS)[number]
  selectedDocumentIds: string[]
  onToggleDocument: (id: string) => void
  onChangeModel: () => void
  observations: string
  onObservationsChange: (value: string) => void
}) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3'>
        <div className='flex items-start gap-2'>
          <Icon name='file-text' className='mt-0.5 size-4 text-primary' />
          <div>
            <p className='text-[11px] uppercase text-muted-foreground'>
              Modelo selecionado
            </p>
            <p className='text-sm font-semibold text-foreground'>{model.title}</p>
          </div>
        </div>
        <Button variant='link' size='xs' onClick={onChangeModel}>
          Trocar
        </Button>
      </div>
      <div>
        <h3 className='flex items-center gap-2 font-serif text-base font-semibold'>
          <Icon name='sparkles' className='size-4 text-primary' />O que a IA vai fazer
        </h3>
        <ul className='mt-2 space-y-2 text-sm text-muted-foreground'>
          <li className='flex items-center gap-2'>
            <Icon name='check-circle-2' className='size-4 shrink-0 text-primary' />
            Preencher qualificação, fundamentação legal padrão e referências ao dossiê
          </li>
          <li className='flex items-center gap-2'>
            <Icon name='check-circle-2' className='size-4 shrink-0 text-primary' />
            Estruturar a peça conforme o modelo escolhido
          </li>
          <li className='flex items-center gap-2'>
            <Icon name='x-circle' className='size-4 shrink-0 text-muted-foreground' />
            Não define tese jurídica — você insere após a geração
          </li>
          <li className='flex items-center gap-2'>
            <Icon name='x-circle' className='size-4 shrink-0 text-muted-foreground' />
            Não protocola nem entrega — apenas gera a minuta
          </li>
        </ul>
      </div>
      <div>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <Icon name='folder-open' className='size-4 text-primary' />
            <h3 className='font-serif text-base font-semibold'>
              Documentos de referência do dossiê{' '}
              <span className='text-destructive'>*</span>
            </h3>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='success'>
              {selectedDocumentIds.length} de {DOCUMENTS.length} selecionados
            </Badge>
          </div>
        </div>
        <p className='mt-1 text-xs text-muted-foreground'>
          Selecione os documentos que serão a base factual desta peça.
        </p>
        <div className='mt-2 divide-y rounded-lg border border-border'>
          {DOCUMENTS.map((document) => (
            <div
              key={document.id}
              className={`flex items-center gap-3 p-3 ${selectedDocumentIds.includes(document.id) ? 'bg-highlight/70' : 'bg-card'}`}
            >
              <Checkbox
                aria-label={`Selecionar ${document.label}`}
                checked={selectedDocumentIds.includes(document.id)}
                onCheckedChange={() => onToggleDocument(document.id)}
              />
              <span className='min-w-0 flex-1'>
                <span className='block text-sm font-semibold'>{document.label}</span>
                <span className='block text-xs text-muted-foreground'>
                  {document.detail}
                </span>
              </span>
              <span className='hidden rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground sm:inline'>
                {document.category}
              </span>
              <Icon name='eye' className='size-4 shrink-0 text-muted-foreground' />
            </div>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor='ai-notes' className='text-sm font-semibold'>
          Observações para a IA{' '}
          <span className='font-normal text-muted-foreground'>(opcional)</span>
        </label>
        <textarea
          id='ai-notes'
          className='mt-1 min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
          placeholder='Ex.: cliente teve período rural entre 1985 e 1990...'
          value={observations}
          onChange={(event) => onObservationsChange(event.target.value)}
        />
      </div>
      <p className='rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground'>
        A geração e o salvamento da peça dependem da integração com o backend e ainda não
        estão disponíveis.
      </p>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div>
          <p className='text-xs text-muted-foreground'>Elaborador</p>
          <div className='mt-1 flex items-center gap-2 rounded-md border border-border p-2 text-sm'>
            <span className='flex size-6 items-center justify-center rounded-full bg-brand-accent text-[10px] font-semibold text-foreground'>
              MC
            </span>
            <span className='flex-1'>Mariana Costa</span>
            <Icon name='chevron-down' className='size-3.5 text-muted-foreground' />
          </div>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Revisor</p>
          <div className='mt-1 flex items-center gap-2 rounded-md border border-border p-2 text-sm'>
            <span className='flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground'>
              RM
            </span>
            <span className='flex-1'>Dr. Ricardo Mendes</span>
            <Icon name='chevron-down' className='size-3.5 text-muted-foreground' />
          </div>
        </div>
      </div>
    </div>
  )
}

function GenerationStep() {
  return (
    <div className='space-y-4 py-4 text-center'>
      <div className='mx-auto flex size-16 items-center justify-center rounded-full border-2 border-primary bg-highlight text-primary'>
        <Icon name='sparkles' className='size-7' />
      </div>
      <div>
        <h3 className='font-serif text-lg font-semibold'>
          Geração com IA ainda não disponível
        </h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          A seleção do modelo e dos documentos está disponível, mas a geração e o
          salvamento da peça dependem da integração com o backend.
        </p>
      </div>
    </div>
  )
}
