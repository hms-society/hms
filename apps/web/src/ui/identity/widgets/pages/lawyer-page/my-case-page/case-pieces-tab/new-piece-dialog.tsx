import { useState } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
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
    title: 'Requerimento Administrativo — Aposentadoria por Tempo de Contribuição',
    description: 'Modelo padrão do escritório para requerimento inicial no INSS.',
    version: 'v2 · atualizado 20/06',
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
    selected: false,
  },
  {
    id: 'cpf',
    label: 'CPF — Cadastro de Pessoa Física',
    detail: 'Situação regular',
    selected: false,
  },
  {
    id: 'address',
    label: 'Comprovante de Residência',
    detail: 'Conta de luz · abril/2026',
    selected: false,
  },
  {
    id: 'cnis',
    label: 'CNIS — Cadastro Nacional de Informações Sociais',
    detail: 'Filiação 12/03/1989 · 342 a 2 m',
    selected: true,
  },
]

export function NewPieceDialog({ open, onOpenChange, onGenerated }: NewPieceDialogProps) {
  const [step, setStep] = useState<Step>(1)
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState(
    DOCUMENTS.filter((document) => document.selected).map((document) => document.id),
  )

  const selectedModel = MODELS.find((model) => model.id === selectedModelId) ?? MODELS[0]

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) setStep(1)
    onOpenChange(nextOpen)
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
          <ModelStep selectedModelId={selectedModelId} onSelect={setSelectedModelId} />
        ) : null}
        {step === 2 ? (
          <PreparationStep
            model={selectedModel}
            selectedDocumentIds={selectedDocumentIds}
            onToggleDocument={handleToggleDocument}
            onChangeModel={() => setStep(1)}
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
            <Button onClick={() => setStep(2)}>
              Próximo <Icon name='arrow-right' />
            </Button>
          ) : null}
          {step === 2 ? (
            <Button
              disabled={selectedDocumentIds.length === 0}
              onClick={() => setStep(3)}
            >
              <Icon name='sparkles' /> Gerar minuta com IA
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
  selectedModelId,
  onSelect,
}: {
  selectedModelId: string
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
          className='h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'
          placeholder='Buscar modelo por nome...'
        />
      </div>
      <div className='space-y-2'>
        {MODELS.map((model) => (
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
}: {
  model: (typeof MODELS)[number]
  selectedDocumentIds: string[]
  onToggleDocument: (id: string) => void
  onChangeModel: () => void
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
        <h3 className='font-serif text-base font-semibold'>O que a IA vai fazer</h3>
        <ul className='mt-2 space-y-2 text-sm text-muted-foreground'>
          <li>
            ✓ Preencher qualificação, fundamentação legal padrão e referências ao dossiê
          </li>
          <li>✓ Estruturar a peça conforme o modelo escolhido</li>
          <li>× Não define tese jurídica — você insere após a geração</li>
          <li>× Não protocola nem entrega — apenas gera a minuta</li>
        </ul>
      </div>
      <div>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='font-serif text-base font-semibold'>
            Documentos de referência do dossiê <span className='text-destructive'>*</span>
          </h3>
          <Badge variant='success'>
            {selectedDocumentIds.length} de {DOCUMENTS.length} selecionados
          </Badge>
        </div>
        <p className='mt-1 text-xs text-muted-foreground'>
          Selecione os documentos que serão a base factual desta peça.
        </p>
        <div className='mt-2 divide-y rounded-lg border border-border'>
          {DOCUMENTS.map((document) => (
            <label
              key={document.id}
              className={`flex cursor-pointer items-center gap-3 p-3 ${selectedDocumentIds.includes(document.id) ? 'bg-highlight/70' : 'bg-card'}`}
            >
              <input
                type='checkbox'
                checked={selectedDocumentIds.includes(document.id)}
                onChange={() => onToggleDocument(document.id)}
                className='size-4 accent-primary'
              />
              <span className='min-w-0 flex-1'>
                <span className='block text-sm font-semibold'>{document.label}</span>
                <span className='block text-xs text-muted-foreground'>
                  {document.detail}
                </span>
              </span>
              <Icon name='eye' className='size-4 text-muted-foreground' />
            </label>
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
        />
      </div>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div>
          <p className='text-xs text-muted-foreground'>Elaborador</p>
          <div className='mt-1 rounded-md border border-border p-2 text-sm'>
            Mariana Costa
          </div>
        </div>
        <div>
          <p className='text-xs text-muted-foreground'>Revisor</p>
          <div className='mt-1 rounded-md border border-border p-2 text-sm'>
            Dr. Ricardo Mendes
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
          Minuta gerada com sucesso
        </h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          A geração foi concluída. Volte à aba Peças para abrir o documento no editor ou
          na revisão técnica.
        </p>
      </div>
      <div className='mx-auto h-2 max-w-md overflow-hidden rounded-full bg-muted'>
        <div className='h-full w-full rounded-full bg-primary' />
      </div>
      <p className='text-xs text-muted-foreground'>
        100% — geração concluída
      </p>
      <div className='space-y-2 text-left'>
        <ProgressItem label='Lendo o dossiê aprovado' done />
        <ProgressItem label='Estruturando a peça conforme o modelo' done />
        <ProgressItem label='Redigindo a fundamentação' done />
        <ProgressItem label='Vinculando referências e assinatura' done />
      </div>
    </div>
  )
}

function ProgressItem({
  label,
  done = false,
  active = false,
}: {
  label: string
  done?: boolean
  active?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${active ? 'border-primary bg-highlight' : 'border-border bg-muted/30'}`}
    >
      <span
        className={`flex size-5 items-center justify-center rounded-full ${done ? 'bg-primary text-primary-foreground' : active ? 'border border-primary text-primary' : 'border border-border text-muted-foreground'}`}
      >
        {done ? (
          <Icon name='check' className='size-3' />
        ) : active ? (
          <Icon name='sparkles' className='size-3' />
        ) : null}
      </span>
      <span>{label}</span>
      {active ? <Badge className='ml-auto text-[10px]'>em andamento</Badge> : null}
    </div>
  )
}
