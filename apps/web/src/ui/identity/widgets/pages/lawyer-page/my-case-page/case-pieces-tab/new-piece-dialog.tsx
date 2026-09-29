import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
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
import type { CaseDocumentGenerationContext } from '@/rest/services/case-document-production-service'

export type NewPieceDialogProps = {
  open: boolean
  caseId?: string
  onOpenChange: (open: boolean) => void
  onGenerated: () => void
}

type Step = 1 | 2 | 3

export function NewPieceDialog({
  open,
  caseId,
  onOpenChange,
  onGenerated,
}: NewPieceDialogProps) {
  const queryClient = useQueryClient()
  const { navigateTo } = useNavigation()
  const { caseDocumentProductionService } = useRestContext()
  const [step, setStep] = useState<Step>(1)
  const [selectedModelId, setSelectedModelId] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [observations, setObservations] = useState('')
  const [generation, setGeneration] = useState<{
    documentId: string
    documentGenerationId: string
  }>()

  const contextQuery = useQuery({
    queryKey: ['case-document-generation-context', caseId],
    enabled: open && Boolean(caseId),
    queryFn: async () => {
      if (!caseId) throw new Error('Caso não identificado.')
      const response = await caseDocumentProductionService.getGenerationContext(caseId)
      if (response.isFailure) response.throwError()
      return response.body
    },
  })
  const context = contextQuery.data as CaseDocumentGenerationContext | undefined
  const models = context?.models ?? []
  const documents = context?.documents ?? []
  const selectedModel = models.find((model) => model.id === selectedModelId)
  const filteredModels = models.filter((model) =>
    `${model.name} ${model.description}`
      .toLocaleLowerCase('pt-BR')
      .includes(modelSearch.trim().toLocaleLowerCase('pt-BR')),
  )

  const generationMutation = useMutation({
    mutationFn: async () => {
      if (!caseId || !selectedModel)
        throw new Error('Selecione um modelo disponível para este caso.')
      const response = await caseDocumentProductionService.generateDocument(caseId, {
        documentSpecificationId: selectedModel.id,
        documentFileIds: selectedDocumentIds,
        ...(observations.trim() ? { instructions: observations.trim() } : {}),
      })
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: (result) => {
      setGeneration(result)
      setStep(3)
      onGenerated()
      void queryClient.invalidateQueries({ queryKey: ['case-documents', caseId] })
    },
  })

  const generationQuery = useQuery({
    queryKey: ['case-document-generation-result', caseId, generation?.documentId],
    enabled: open && step === 3 && Boolean(caseId && generation?.documentId),
    queryFn: async () => {
      if (!caseId || !generation?.documentId) throw new Error('Geração não identificada.')
      const response = await caseDocumentProductionService.getDocument(
        caseId,
        generation.documentId,
      )
      if (response.isFailure) response.throwError()
      return response.body
    },
    refetchInterval: (query) => {
      const status = query.state.data?.generation?.status
      if (status === 'completed' || status === 'failed' || status === 'cancelled')
        return false
      if (query.state.data?.versions.length) return false
      return 2500
    },
    retry: true,
  })
  const isGenerationComplete = Boolean(
    generationQuery.data?.generation?.status === 'completed' ||
      generationQuery.data?.versions.length,
  )
  const isGenerationFailed = Boolean(
    generationQuery.data?.generation?.status === 'failed' ||
      generationQuery.data?.generation?.status === 'cancelled' ||
      generationQuery.isError,
  )

  useEffect(() => {
    if (!selectedModelId && models.length) setSelectedModelId(models[0]?.id ?? '')
  }, [models, selectedModelId])

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setStep(1)
      setSelectedModelId('')
      setModelSearch('')
      setSelectedDocumentIds([])
      setObservations('')
      setGeneration(undefined)
      generationMutation.reset()
      void queryClient.removeQueries({
        queryKey: ['case-document-generation-result', caseId],
      })
    }
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
            <StepLabel active current={step === 1} label='Modelo' number='1' />
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
            loading={contextQuery.isLoading}
            error={
              contextQuery.isError
                ? 'Não foi possível carregar modelos e documentos deste caso.'
                : undefined
            }
            generationAllowed={context?.canGenerate ?? false}
            models={filteredModels}
            search={modelSearch}
            selectedModelId={selectedModelId}
            onSearch={setModelSearch}
            onSelect={setSelectedModelId}
          />
        ) : null}
        {step === 2 && selectedModel ? (
          <PreparationStep
            model={selectedModel}
            documents={documents}
            selectedDocumentIds={selectedDocumentIds}
            onToggleDocument={handleToggleDocument}
            onChangeModel={() => setStep(1)}
            observations={observations}
            onObservationsChange={setObservations}
            checklistGateDecision={context?.checklistGateDecision}
            error={
              generationMutation.isError ? generationMutation.error.message : undefined
            }
          />
        ) : null}
        {step === 3 ? (
          <GenerationStep
            complete={isGenerationComplete}
            failed={isGenerationFailed}
            versionNumber={generationQuery.data?.versions.reduce(
              (latest, candidate) => Math.max(latest, candidate.versionNumber),
              0,
            )}
          />
        ) : null}

        {step !== 3 || isGenerationComplete ? (
          <DialogFooter className={step === 3 ? 'sm:justify-end' : 'sm:justify-between'}>
            {step === 1 ? (
              <Button variant='ghost' onClick={() => handleClose(false)}>
                Cancelar
              </Button>
            ) : step === 2 ? (
              <Button variant='outline' onClick={() => setStep(1)}>
                <Icon name='arrow-left' /> Voltar
              </Button>
            ) : null}
            {step === 1 ? (
              <Button
                disabled={
                  !selectedModelId ||
                  filteredModels.length === 0 ||
                  contextQuery.isLoading ||
                  !context?.canGenerate
                }
                onClick={() => setStep(2)}
              >
                Próximo <Icon name='arrow-right' />
              </Button>
            ) : null}
            {step === 2 ? (
              <Button
                disabled={!selectedDocumentIds.length || generationMutation.isPending}
                onClick={() => generationMutation.mutate()}
              >
                <Icon name='sparkles' />{' '}
                {generationMutation.isPending ? 'Enviando...' : 'Gerar minuta com IA'}
              </Button>
            ) : null}
            {step === 3 && isGenerationComplete && generation ? (
              <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap'>
                <Button variant='outline' onClick={() => handleClose(false)}>
                  Voltar para peças
                </Button>
                <Button variant='outline' onClick={() => openGeneratedDocument('editor')}>
                  <Icon name='pencil' /> Abrir no editor
                </Button>
                <Button onClick={() => openGeneratedDocument('review')}>
                  <Icon name='eye' /> Abrir revisão técnica
                </Button>
              </div>
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )

  function openGeneratedDocument(destination: 'editor' | 'review') {
    if (!generation || !caseId) return
    handleClose(false)
    onGenerated()
    void navigateTo(
      destination === 'editor' ? 'lawyerCasePieceEditor' : 'lawyerCasePieceReview',
      {
        params: { caseId, documentId: generation.documentId },
      },
    )
  }
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
  loading,
  error,
  generationAllowed,
  models,
  search,
  selectedModelId,
  onSearch,
  onSelect,
}: {
  loading: boolean
  error?: string
  generationAllowed: boolean
  models: CaseDocumentGenerationContext['models']
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
      {loading ? (
        <p className='rounded-md border p-4 text-sm text-muted-foreground'>
          Carregando modelos e documentos validados...
        </p>
      ) : null}
      {error ? (
        <p
          role='alert'
          className='rounded-md border border-destructive/40 p-3 text-sm text-destructive'
        >
          {error}
        </p>
      ) : null}
      {!loading && !error && !generationAllowed ? (
        <p className='rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground'>
          A geração será liberada quando o dossiê estiver homologado e o caso estiver na
          etapa de produção jurídica.
        </p>
      ) : null}
      <div className='space-y-2'>
        {!loading && !error && models.length === 0 ? (
          <p className='rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground'>
            Nenhum modelo disponível para este caso.
          </p>
        ) : null}
        {models.map((model) => (
          <button
            key={model.id}
            type='button'
            onClick={() => onSelect(model.id)}
            className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedModelId === model.id ? 'border-primary bg-highlight' : 'border-border hover:bg-muted/50'}`}
          >
            <span className='flex items-start gap-3'>
              <span
                className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${selectedModelId === model.id ? 'border-primary bg-primary' : 'border-input'}`}
              >
                {selectedModelId === model.id ? (
                  <span className='size-1.5 rounded-full bg-primary-foreground' />
                ) : null}
              </span>
              <span className='min-w-0'>
                <span className='block text-sm font-semibold text-foreground'>
                  {model.name}
                </span>
                <span className='mt-1 block text-xs text-muted-foreground'>
                  {model.description}
                </span>
                <span className='mt-1 block text-[11px] text-muted-foreground'>
                  Disponível para produção jurídica
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PreparationStep({
  model,
  documents,
  selectedDocumentIds,
  onToggleDocument,
  onChangeModel,
  observations,
  onObservationsChange,
  checklistGateDecision,
  error,
}: {
  model: CaseDocumentGenerationContext['models'][number]
  documents: CaseDocumentGenerationContext['documents']
  selectedDocumentIds: string[]
  onToggleDocument: (id: string) => void
  onChangeModel: () => void
  observations: string
  onObservationsChange: (value: string) => void
  checklistGateDecision?: string
  error?: string
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
            <p className='text-sm font-semibold text-foreground'>{model.name}</p>
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
            Preencher variáveis com dados dos documentos selecionados e validados
          </li>
          <li className='flex items-center gap-2'>
            <Icon name='check-circle-2' className='size-4 shrink-0 text-primary' />
            Estruturar a minuta conforme o modelo escolhido
          </li>
          <li className='flex items-center gap-2'>
            <Icon name='x-circle' className='size-4 shrink-0 text-muted-foreground' />
            Não inventa valores ausentes nem resolve divergências entre fontes
          </li>
          <li className='flex items-center gap-2'>
            <Icon name='x-circle' className='size-4 shrink-0 text-muted-foreground' />
            Não aprova, protocola nem entrega a peça
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
          <Badge variant='success'>
            {selectedDocumentIds.length} de {documents.length} selecionados
          </Badge>
        </div>
        <p className='mt-1 text-xs text-muted-foreground'>
          Selecione os documentos validados que serão a base factual desta peça. Cada
          arquivo ficará registrado com sua origem.
        </p>
        <div className='mt-2 divide-y rounded-lg border border-border'>
          {documents.length === 0 ? (
            <p className='p-4 text-sm text-muted-foreground'>
              Nenhum documento do checklist tem validação humana concluída para servir de
              referência.
            </p>
          ) : null}
          {documents.map((document) => (
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
                  {document.fileName} ·{' '}
                  {document.validationStatus === 'validated'
                    ? 'validado por pessoa'
                    : document.validationStatus}
                </span>
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
          placeholder='Instruções adicionais para a minuta...'
          value={observations}
          onChange={(event) => onObservationsChange(event.target.value)}
        />
      </div>
      {error ? (
        <p
          role='alert'
          className='rounded-md border border-destructive/40 p-3 text-sm text-destructive'
        >
          {error}
        </p>
      ) : null}
      <p className='rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground'>
        O solicitante é o colaborador autenticado. A minuta só se torna apta a protocolo
        após revisão e aprovação humana.
      </p>
      {checklistGateDecision === 'approved_with_exception' ? (
        <p className='rounded-md border border-brand-accent/50 bg-highlight p-3 text-xs text-foreground'>
          Dossiê aprovado com exceção. Dados ausentes permanecerão como campos pendentes
          na minuta.
        </p>
      ) : null}
    </div>
  )
}

function GenerationStep({
  complete,
  failed,
  versionNumber,
}: {
  complete: boolean
  failed: boolean
  versionNumber?: number
}) {
  return (
    <div className='space-y-4 py-4 text-center'>
      <div className='mx-auto flex size-16 items-center justify-center rounded-full border-2 border-primary bg-highlight text-primary'>
        <Icon
          name={complete ? 'check' : failed ? 'x-circle' : 'sparkles'}
          className='size-7'
        />
      </div>
      <div>
        <h3 className='font-serif text-lg font-semibold'>
          {complete
            ? 'Minuta pronta para revisão'
            : failed
              ? 'Não foi possível confirmar a geração'
              : 'A IA está preparando a minuta'}
        </h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          {complete
            ? `A versão ${versionNumber ? `v${versionNumber}` : 'atual'} foi criada. Escolha abrir no editor ou na revisão técnica.`
            : failed
              ? 'Você pode fechar esta janela e verificar o estado na lista de peças.'
              : 'A geração continua em segundo plano; você pode fechar esta janela e voltar depois.'}
        </p>
      </div>
      {!complete && !failed ? (
        <div className='mx-auto h-2 max-w-sm overflow-hidden rounded-full bg-muted'>
          <div className='h-full w-1/2 animate-pulse rounded-full bg-primary' />
        </div>
      ) : null}
    </div>
  )
}
