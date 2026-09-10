import { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createCaseSchema, type CreateCaseData } from '@hms/validation/case-management'
import { useCurrentCollaboratorQuery } from '@/ui/identity/hooks/use-current-collaborator-query'
import { useIntakesQuery } from '@/ui/intake/widgets/pages/intakes-page/use-intakes-query'
import { useCreateCaseMutation } from './use-create-case-mutation'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { ROUTES } from '@/constants/routes'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useQuery } from '@tanstack/react-query'
import { useLegalAreasQuery } from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-areas-query'
import { useLegalTopicsQuery } from '@/ui/intake/widgets/pages/new-intake-page/demand-step/use-legal-topics-query'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Label } from '@/ui/shadcn/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/ui/shadcn/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/shadcn/popover'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { AddTeamMemberDialog } from './components/add-team-member-dialog'

export function CreateCasePage() {
  const { currentCollaborator } = useCurrentCollaboratorQuery()

  const form = useForm<CreateCaseData>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      title: '',
      intakeId: '',
      legalAreaId: '',
      legalTopicId: '',
      description: '',
      team: [],
    },
  })

  const navigate = useNavigate()
  const { mutate: createCase, isPending: isCreatingCase } = useCreateCaseMutation()

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'team',
  })

  const [intakeOpen, setIntakeOpen] = useState(false)
  const [intakeSearch, setIntakeSearch] = useState('')
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false)
  const intakesQuery = useIntakesQuery({
    page: 1,
    pageSize: 10,
    search: intakeSearch,
    status: 'contracted',
  })
  const intakes = intakesQuery.data?.items ?? []

  const { intakeService } = useRestContext()

  const { legalAreas } = useLegalAreasQuery()
  const selectedLegalAreaId = form.watch('legalAreaId')
  const { legalTopics } = useLegalTopicsQuery(selectedLegalAreaId)
  const selectedIntakeId = form.watch('intakeId')

  const { data: selectedIntakeDetails } = useQuery({
    queryKey: ['intake', selectedIntakeId],
    queryFn: async () => {
      const res = await intakeService.getIntake(selectedIntakeId as string)
      if (res.isFailure) throw new Error('Falha ao buscar triagem')
      return res.body
    },
    enabled: !!selectedIntakeId,
  })

  useEffect(() => {
    if (selectedIntakeDetails) {
      if (selectedIntakeDetails.legalAreaId) {
        form.setValue('legalAreaId', selectedIntakeDetails.legalAreaId)
      }
      if (
        selectedIntakeDetails.legalTopicId &&
        legalTopics.some((t) => t.id === selectedIntakeDetails.legalTopicId)
      ) {
        form.setValue('legalTopicId', selectedIntakeDetails.legalTopicId)
      }
    }
  }, [selectedIntakeDetails, form, legalTopics])

  const onSubmit = (data: CreateCaseData) => {
    if (!data.intakeId) {
      toast.error(
        'Este cliente não possui uma triagem (Intake) disponível para abertura de caso.',
      )
      return
    }

    const payload = {
      ...data,
      team:
        data.team.length === 0 && currentCollaborator
          ? [
              {
                collaboratorId: currentCollaborator.id,
                role: 'lead_lawyer' as const,
                permission: 'execução' as const,
              },
            ]
          : data.team,
    }

    createCase(payload, {
      onSuccess: () => {
        toast.success('Caso criado com sucesso!')
        navigate({ to: ROUTES.lawyerCases as any })
      },
      onError: (err: any) => {
        toast.error(
          err.message || 'Erro ao criar caso. Verifique se o Intake já foi utilizado.',
        )
      },
    })
  }

  return (
    <div className='mt-3 flex w-full flex-col gap-8 sm:gap-12 pb-20'>
      <div className='flex items-start gap-3 mb-2 sm:mb-4'>
        <Anchor
          route='lawyerCases'
          className='text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors mt-1'
        >
          <Icon name='arrow-left' className='size-5' />
        </Anchor>
        <div className='flex flex-col text-left'>
          <h1 className='font-serif text-[24px] sm:text-[28px] font-semibold text-teal-900'>
            Novo Caso
          </h1>
          <p className='text-[13px] sm:text-[14px] text-muted-foreground'>
            Preencha os detalhes e defina a equipe para abrir um novo dossiê.
          </p>
        </div>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 sm:space-y-12'>
        <div className='rounded-2xl border border-border bg-card p-6 sm:p-6 shadow-sm space-y-6'>
          <h2 className='text-[18px] font-semibold text-foreground mb-4 text-left'>
            Detalhes do Caso
          </h2>

          <div className='space-y-5'>
            <div className='space-y-1.5 text-left'>
              <Label className='text-[14px] font-medium'>
                Título do caso<span className='text-destructive'>*</span>
              </Label>
              <Input
                {...form.register('title')}
                placeholder='Ex: Aposentadoria por Tempo de Contribuição'
                className='h-11 rounded-xl shadow-sm'
              />
              {form.formState.errors.title && (
                <span className='text-xs text-destructive'>
                  {form.formState.errors.title.message}
                </span>
              )}
            </div>
            <div className='space-y-2.5'>
              <Label className='text-[14px] font-medium'>
                Triagem de Origem<span className='text-destructive'>*</span>
              </Label>
              <Controller
                control={form.control}
                name='intakeId'
                render={({ field }) => {
                  const selected = intakes.find((i) => i.intakeId === field.value)

                  return (
                    <Popover open={intakeOpen} onOpenChange={setIntakeOpen}>
                      <PopoverTrigger asChild>
                        <div className='relative w-full cursor-pointer'>
                          <Input
                            placeholder='Digite o nome do cliente, CPF ou ID da triagem...'
                            value={
                              intakeOpen
                                ? intakeSearch
                                : selected
                                  ? `Triagem #${selected.displayId} - ${selected.client.name}`
                                  : intakeSearch
                            }
                            onChange={(e) => {
                              if (selected && !intakeOpen) {
                                field.onChange('')
                              }
                              setIntakeSearch(e.target.value)
                              setIntakeOpen(true)
                            }}
                            onClick={() => setIntakeOpen(true)}
                            className='h-11 rounded-xl shadow-sm pr-10 cursor-pointer'
                            readOnly={!intakeOpen && !!selected}
                          />
                          <Icon
                            name='search'
                            className='absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground'
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent
                        className='w-[var(--radix-popover-trigger-width)] p-0 rounded-xl'
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <Command>
                          <CommandList>
                            <CommandEmpty>
                              {intakesQuery.isLoading
                                ? 'Buscando...'
                                : 'Nenhuma triagem contratada encontrada.'}
                            </CommandEmpty>
                            <CommandGroup>
                              {intakes.map((intake: any) => (
                                <CommandItem
                                  key={intake.intakeId}
                                  value={`${intake.displayId} ${intake.client.taxId} ${intake.client.name}`}
                                  onSelect={() => {
                                    field.onChange(intake.intakeId)
                                    setIntakeSearch('')
                                    setIntakeOpen(false)
                                  }}
                                >
                                  <Icon
                                    name='check'
                                    className={`mr-2 size-4 ${
                                      field.value === intake.intakeId
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                  />
                                  <span className='text-muted-foreground text-xs mr-2'>
                                    {intake.displayId}
                                  </span>
                                  <span className='truncate'>{intake.client.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )
                }}
              />
              {form.formState.errors.intakeId && (
                <span className='text-xs text-destructive'>
                  {form.formState.errors.intakeId.message}
                </span>
              )}
            </div>

            <div className='flex flex-col sm:flex-row items-start gap-4'>
              <div className='space-y-1.5 w-full sm:flex-1 text-left'>
                <Label className='text-[14px] font-medium'>
                  Área do Direito<span className='text-destructive'>*</span>
                </Label>
                <Controller
                  control={form.control}
                  name='legalAreaId'
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(val) => {
                        field.onChange(val)
                        form.setValue('legalTopicId', '')
                      }}
                    >
                      <SelectTrigger className='h-11 rounded-xl shadow-sm'>
                        <SelectValue placeholder='Selecione a área' />
                      </SelectTrigger>
                      <SelectContent className='rounded-xl max-h-[300px]'>
                        {legalAreas.map((area) => (
                          <SelectItem
                            key={area.id}
                            value={area.id}
                            className='rounded-lg'
                          >
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.legalAreaId && (
                  <span className='text-xs text-destructive'>
                    {form.formState.errors.legalAreaId.message}
                  </span>
                )}
              </div>
              <div className='space-y-1.5 w-full sm:flex-1 text-left'>
                <Label className='text-[14px] font-medium'>
                  Tema<span className='text-destructive'>*</span>
                </Label>
                <Controller
                  control={form.control}
                  name='legalTopicId'
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={!selectedLegalAreaId}
                    >
                      <SelectTrigger className='h-11 rounded-xl shadow-sm'>
                        <SelectValue placeholder='Selecione o tema' />
                      </SelectTrigger>
                      <SelectContent className='rounded-xl max-h-[300px]'>
                        {legalTopics.map((topic) => (
                          <SelectItem
                            key={topic.id}
                            value={topic.id}
                            className='rounded-lg'
                          >
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.legalTopicId && (
                  <span className='text-xs text-destructive'>
                    {form.formState.errors.legalTopicId.message}
                  </span>
                )}
              </div>
            </div>
            <div className='space-y-2.5'>
              <Label className='text-[14px] font-medium'>
                Descrição{' '}
                <span className='text-muted-foreground font-normal'>(Opcional)</span>
              </Label>
              <textarea
                {...form.register('description')}
                placeholder='Breve descrição ou observação inicial do caso...'
                className='flex min-h-[100px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none'
              />
            </div>
          </div>
        </div>
        <div className='rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm'>
          <h2 className='text-[18px] font-semibold text-teal-900 mb-1 text-left'>
            Equipe do Caso
          </h2>
          <p className='text-[13px] text-muted-foreground mb-6 text-left'>
            Designe perfis auxiliares e controle o escopo de responsabilidade técnica.
          </p>

          <div className='space-y-6'>
            <div className='space-y-3'>
              <Label className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded'>
                Responsabilidade Formal
              </Label>
              <div className='flex flex-row sm:items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden gap-4'>
                <div className='absolute left-0 top-0 bottom-0 w-1 bg-teal-800' />
                <div className='flex items-center gap-3 sm:gap-4 pl-2'>
                  <Avatar className='size-10 sm:size-12'>
                    <AvatarFallback className='bg-slate-100 text-slate-600'>
                      {currentCollaborator?.professionalName
                        ?.substring(0, 2)
                        .toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col gap-1'>
                    <span className='font-semibold text-[14px] sm:text-[15px] text-foreground leading-tight'>
                      {currentCollaborator?.professionalName || 'Advogado'}
                    </span>
                    <div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
                      <Badge
                        variant='secondary'
                        className='bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-full px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-[11px] font-medium border-transparent'
                      >
                        Advogado Principal
                      </Badge>
                      <span className='text-[11px] sm:text-[12px] text-muted-foreground font-medium'>
                        Responsável Técnico
                      </span>
                    </div>
                  </div>
                </div>
                <Icon
                  name='lock'
                  className='size-5 text-muted-foreground/40 sm:mr-2 shrink-0'
                />
              </div>
            </div>
            <div className='space-y-4 pt-4 border-t border-border/50'>
              <Label className='text-[10px] font-bold text-muted-foreground uppercase tracking-widest'>
                Equipe Auxiliar
              </Label>
              <div className='space-y-3'>
                {fields.length === 0 && (
                  <div className='text-[13px] text-muted-foreground py-4 text-center border border-dashed border-border rounded-xl bg-card/50'>
                    Nenhum membro auxiliar adicionado.
                  </div>
                )}
                {fields.map((field: any, index) => (
                  <div
                    key={field.id}
                    className='flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full bg-slate-50/50 sm:bg-transparent border sm:border-none border-border/50 p-3 sm:p-0 rounded-xl'
                  >
                    <div className='flex items-center justify-between w-full sm:w-auto sm:flex-1 sm:min-w-[200px]'>
                      <div className='flex items-center gap-3'>
                        <Avatar className='size-9'>
                          <AvatarFallback className='bg-slate-100 text-xs text-slate-600'>
                            {field.name?.substring(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className='font-medium text-[14px] text-foreground truncate'>
                          {field.name}
                        </span>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => remove(index)}
                        className='sm:hidden size-8 text-destructive/80 hover:text-destructive  rounded-full shrink-0'
                      >
                        <Icon name='trash-2' className='size-4' />
                      </Button>
                    </div>
                    <div className='w-full sm:w-[160px] shrink-0'>
                      <Select
                        value={field.role}
                        onValueChange={(val) => update(index, { ...field, role: val })}
                      >
                        <SelectTrigger className='h-10 rounded-xl shadow-sm text-[13px] bg-card'>
                          <SelectValue placeholder='Cargo' />
                        </SelectTrigger>
                        <SelectContent className='rounded-xl'>
                          <SelectItem value='lawyer'>Advogado Auxiliar</SelectItem>
                          <SelectItem value='paralegal'>Paralegal</SelectItem>
                          <SelectItem value='intern'>Estagiário</SelectItem>
                          <SelectItem value='supervisor'>Supervisor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='w-full sm:w-[150px] shrink-0'>
                      <Select
                        value={field.permission}
                        onValueChange={(val) =>
                          update(index, { ...field, permission: val })
                        }
                      >
                        <SelectTrigger className='h-10 rounded-xl shadow-sm text-[13px] bg-card'>
                          <SelectValue placeholder='Permissão' />
                        </SelectTrigger>
                        <SelectContent className='rounded-xl'>
                          <SelectItem value='visualização'>Visualização</SelectItem>
                          <SelectItem value='edição'>Edição</SelectItem>
                          <SelectItem value='execução'>Execução</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => remove(index)}
                      className='hidden sm:flex size-9 text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0'
                    >
                      <Icon name='trash-2' className='size-4' />
                    </Button>
                  </div>
                ))}
              </div>
              <div className='pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setIsAddTeamModalOpen(true)}
                  className='w-full sm:w-auto rounded-full text-[13px] h-9 border-teal-700 text-teal-800'
                >
                  <Icon name='plus' className='mr-1.5 size-4' />
                  Adicionar Membro
                </Button>
              </div>
            </div>
            <div className='mt-4 flex items-start gap-3 rounded-xl bg-teal-50 p-4 text-teal-900 border border-teal-100'>
              <Icon name='bell' className='size-5 shrink-0 mt-0.5 text-teal-600' />
              <p className='text-[13px] leading-relaxed'>
                Os membros acima serão notificados automaticamente via e-mail e push sobre
                a abertura deste caso.
              </p>
            </div>
          </div>
        </div>
        <div className='flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-6 pt-4'>
          <Anchor route='lawyerCases' className='w-full sm:w-auto'>
            <Button
              type='button'
              variant='ghost'
              className='w-full sm:w-auto rounded-full px-6 py-2 hover:bg-muted font-medium'
            >
              Cancelar
            </Button>
          </Anchor>
          <Button
            type='submit'
            disabled={isCreatingCase || !form.watch('intakeId')}
            className='w-full sm:w-auto rounded-full px-8 py-2 bg-teal-800 hover:bg-teal-900 text-white'
          >
            {isCreatingCase ? 'Criando...' : 'Criar Caso'}
          </Button>
        </div>
      </form>
      <AddTeamMemberDialog
        isOpen={isAddTeamModalOpen}
        onClose={() => setIsAddTeamModalOpen(false)}
        onAdd={(member) => append(member as any)}
      />
    </div>
  )
}
