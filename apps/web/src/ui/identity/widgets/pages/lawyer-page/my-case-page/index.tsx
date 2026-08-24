import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon, type IconName } from '@/ui/shared/widgets/components/icon'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/shadcn/breadcrumb'
import { Button } from '@/ui/shadcn/button'
import { Tabs, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'

type ChecklistItemStatus = 'validado' | 'solicitado' | 'nao_solicitado'

type ChecklistItemType = {
  id: string
  title: string
  status: ChecklistItemStatus
  subtitle?: string
  pendencies?: number
  documentName?: string
}

type ActivityItemType = {
  id: string
  icon: IconName
  title: string
  description: string
}

const MOCK_CHECKLIST: ChecklistItemType[] = [
  {
    id: '1',
    title: 'Procuração Assinada',
    status: 'validado',
    documentName: 'procuracao_assinada.pdf - validado por João Pedro - hoje 09:12',
  },
  {
    id: '2',
    title: 'Documento de Identificação Oficial',
    status: 'solicitado',
    pendencies: 1,
    subtitle: 'Pendência ativa - aguardando cliente há 2 dias',
  },
  {
    id: '3',
    title: 'Comprovante de Vínculo',
    status: 'solicitado',
    pendencies: 1,
    subtitle: 'Pendência ativa - aguardando cliente há 2 dias',
  },
  {
    id: '4',
    title: 'Comprovante de Residência',
    status: 'solicitado',
    pendencies: 1,
    subtitle: 'Pendência ativa - aguardando cliente há 2 dias',
  },
  {
    id: '5',
    title: 'CTPS (Carteira de Trabalho)',
    status: 'solicitado',
    pendencies: 1,
    subtitle: 'Pendência ativa - aguardando cliente há 2 dias',
  },
  {
    id: '6',
    title: 'Certidão de Tempo de Contribuição',
    status: 'nao_solicitado',
    subtitle: 'Ainda não solicitado ao cliente',
  },
  {
    id: '7',
    title: 'Laudos Médicos/Periciais',
    status: 'nao_solicitado',
    subtitle: 'Ainda não solicitado ao cliente',
  },
]

const MOCK_ACTIVITIES: ActivityItemType[] = [
  {
    id: 'a1',
    icon: 'check',
    title: 'Procuração validada',
    description: 'João Pedro (Paralegal) - hoje, 09:12',
  },
  {
    id: 'a2',
    icon: 'inbox',
    title: 'Lote LOTE-20260703-0112 recebido',
    description: 'Portal do Cliente - Antônio Carvalho - 03/07, 16:40',
  },
  {
    id: 'a3',
    icon: 'list-checks',
    title: 'Checklist instanciado do template Previdenciário v3',
    description: 'Sistema - 03/07, 14:20',
  },
]

const CASE_STAGES: Array<{
  icon: IconName
  label: string
  status?: string
  isActive?: boolean
}> = [
  {
    icon: 'file-text',
    label: 'Documentação',
    status: 'Em formação',
    isActive: true,
  },
  { icon: 'pencil', label: 'Produção Jurídica' },
  { icon: 'inbox', label: 'Protocolo / Entrega' },
  { icon: 'chart-line', label: 'Execução' },
  { icon: 'check', label: 'Encerramento' },
]

const TEAM_MEMBERS = [
  { initials: 'RM', className: 'bg-primary text-primary-foreground' },
  { initials: 'MC', className: 'bg-amber-500 text-white' },
  { initials: 'JP', className: 'bg-emerald-600 text-white' },
  { initials: 'BO', className: 'bg-zinc-500 text-white' },
]

function getChecklistIcon(itemStatus: ChecklistItemStatus): IconName {
  if (itemStatus === 'validado') return 'check'
  if (itemStatus === 'solicitado') return 'clock'
  return 'file-minus'
}

function getChecklistIconClasses(itemStatus: ChecklistItemStatus) {
  if (itemStatus === 'validado') {
    return 'bg-primary text-primary-foreground'
  }

  if (itemStatus === 'solicitado') {
    return 'border border-amber-500/40 bg-amber-500/10 text-amber-700'
  }

  return 'bg-muted text-muted-foreground'
}

function getChecklistRowClasses(itemStatus: ChecklistItemStatus) {
  if (itemStatus === 'validado') return 'border-primary/10 bg-highlight'
  return 'border-border bg-card'
}

function getChecklistActionLabel(itemStatus: ChecklistItemStatus) {
  if (itemStatus === 'validado') return 'Ver documento'
  if (itemStatus === 'solicitado') return 'Reenviar cobrança'
  return 'Solicitar'
}

function getChecklistActionIcon(itemStatus: ChecklistItemStatus): IconName {
  if (itemStatus === 'validado') return 'eye'
  if (itemStatus === 'solicitado') return 'send'
  return 'plus'
}

export const CasoDetalheChecklistPage = () => {
  return (
    <div className='flex w-full flex-col gap-4 pb-10 font-sans'>
      <Breadcrumb className='text-[11px]'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Anchor route='home'>Início</Anchor>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Anchor route='home'>Meus casos</Anchor>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>CASO-20260703-0089</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className='rounded-lg border border-border bg-card px-5 py-4 shadow-xs'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div className='flex min-w-0 flex-col gap-1.5'>
            <div className='flex flex-wrap items-center gap-2'>
              <h1 className='font-serif text-2xl font-semibold text-foreground'>
                Aposentadoria por Tempo de Contribuição
              </h1>
              <Badge variant='attention' className='h-5 rounded-full px-2 text-[10px]'>
                <span className='size-1.5 rounded-full bg-amber-500' />
                Documentação em formação
              </Badge>
            </div>

            <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground'>
              <span className='flex items-center gap-1'>
                <Icon name='tag' className='size-3' />
                CASO-20260703-0089
              </span>
              <span className='flex items-center gap-1'>
                <Icon name='scale' className='size-3' />
                Direito Previdenciário
              </span>
              <span className='flex items-center gap-1'>
                <Icon name='user' className='size-3' />
                Antônio Carvalho
              </span>
              <span className='flex items-center gap-1'>
                <Icon name='alert-circle' className='size-3' />
                Prioridade: Normal
              </span>
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-end gap-2'>
            <div className='mr-1 flex items-center'>
              <div className='flex -space-x-1.5'>
                {TEAM_MEMBERS.map((member) => (
                  <Avatar key={member.initials} className='size-7 border-2 border-card'>
                    <AvatarFallback className={`${member.className} text-[10px]`}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className='ml-3 text-[11px] font-medium text-muted-foreground'>
                Equipe do caso
              </span>
            </div>
            <Button
              variant='outline'
              size='xs'
              className='rounded-full bg-accent text-accent-foreground'
            >
              <Icon name='plus' className='size-3' />
              Nova tarefa
            </Button>
            <Button size='xs' className='rounded-full'>
              <Icon name='plus' className='size-3' />
              Nova peça
            </Button>
          </div>
        </div>

        <div className='mt-5 flex w-full flex-wrap items-center gap-x-4 gap-y-3 overflow-hidden border-t border-border pt-4'>
          {CASE_STAGES.map((stage, index) => (
            <div key={stage.label} className='flex min-w-fit items-center'>
              <div
                className={`flex items-center gap-2 text-[11px] font-semibold ${
                  stage.isActive ? 'text-primary' : 'text-muted-foreground opacity-60'
                }`}
              >
                <div
                  className={`flex size-8 items-center justify-center rounded-full ${
                    stage.isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background'
                  }`}
                >
                  <Icon name={stage.icon} className='size-3.5' />
                </div>
                <span className='flex flex-col'>
                  {stage.label}
                  {stage.status && (
                    <span className='text-[10px] font-normal text-primary/70'>
                      {stage.status}
                    </span>
                  )}
                </span>
              </div>
              {index < CASE_STAGES.length - 1 && (
                <div className='mx-2 hidden h-px w-10 bg-border lg:block' />
              )}
            </div>
          ))}
        </div>
      </section>

      <Tabs defaultValue='checklist' className='w-full'>
        <TabsList
          variant='line'
          className='flex-wrap gap-x-8 gap-y-1 overflow-hidden text-[11px]'
        >
          <TabsTrigger value='visao-geral' className='py-2 text-[11px]'>
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value='checklist' className='gap-2 py-2 text-[11px]'>
            Checklist & Dossiê
            <Badge variant='secondary' className='h-4 rounded-full px-1 text-[9px]'>
              6
            </Badge>
          </TabsTrigger>
          <TabsTrigger value='pecas' className='py-2 text-[11px]' disabled>
            <Icon name='lock' className='size-3' />
            Peças
          </TabsTrigger>
          <TabsTrigger value='prazos' className='py-2 text-[11px]'>
            Prazos & Tarefas
          </TabsTrigger>
          <TabsTrigger value='andamentos' className='py-2 text-[11px]'>
            Andamentos
          </TabsTrigger>
          <TabsTrigger value='comunicacoes' className='py-2 text-[11px]'>
            Comunicações
          </TabsTrigger>
          <TabsTrigger value='encerramento' className='py-2 text-[11px]'>
            Encerramento
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className='flex items-center justify-between gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5'>
        <div className='flex items-start gap-3'>
          <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-amber-700'>
            <Icon name='lock' className='size-3.5' />
          </div>
          <div className='flex flex-col gap-0.5'>
            <h2 className='text-xs font-semibold text-amber-800'>
              Gate de produção jurídica
            </h2>
            <p className='text-[11px] text-amber-800/80'>
              O caso só avança para Produção Jurídica com o checklist em &quot;Aprovado
              para produção&quot; ou &quot;Aprovado com exceção&quot;. Faltam 6 itens
              obrigatórios.
            </p>
          </div>
        </div>
        <Button
          variant='outline'
          size='xs'
          className='rounded-full border-amber-500/20 bg-card text-amber-800 hover:bg-amber-500/20'
          disabled
        >
          <Icon name='check' className='size-3' />
          Aprovar checklist final
        </Button>
      </div>

      <section className='flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-xs'>
        <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
          <div className='flex flex-col gap-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2 className='font-serif text-lg font-semibold text-foreground'>
                Checklist Documental
              </h2>
              <Badge variant='attention' className='h-5 rounded-full px-2 text-[10px]'>
                Recebimento parcial
              </Badge>
            </div>
            <p className='text-[11px] text-muted-foreground'>
              Instanciado do template Previdenciário v3 - 03/07/2026
            </p>
          </div>

          <div className='flex w-full max-w-56 flex-col items-end gap-1.5'>
            <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
              <div className='h-full w-[14%] rounded-full bg-primary' />
            </div>
            <span className='text-[11px] font-semibold text-foreground'>
              1 de 7 obrigatórios - 14%
            </span>
          </div>
        </div>

        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            variant='brand'
            size='xs'
            className='h-7 rounded-full bg-background text-[10px]'
          >
            <Icon name='check-circle-2' className='size-3' />
            Mesa de Validação
            <Icon name='arrow-right' className='size-3' />
          </Button>
          <Button
            variant='brand'
            size='xs'
            className='h-7 rounded-full bg-background text-[10px]'
          >
            Filtrado por este caso
            <Icon name='arrow-right' className='size-3' />
          </Button>
        </div>

        <div className='flex flex-col gap-3'>
          <h3 className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            Itens obrigatórios
          </h3>
          <div className='flex flex-col gap-1.5'>
            {MOCK_CHECKLIST.map((item) => (
              <div
                key={item.id}
                className={`flex min-w-0 flex-col gap-3 rounded-md border px-3 py-2 md:flex-row md:items-center md:justify-between ${getChecklistRowClasses(
                  item.status,
                )}`}
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md ${getChecklistIconClasses(
                      item.status,
                    )}`}
                  >
                    <Icon name={getChecklistIcon(item.status)} className='size-3' />
                  </div>
                  <div className='flex min-w-0 flex-col gap-0.5'>
                    <div className='flex flex-wrap items-center gap-1.5'>
                      <span className='text-xs font-semibold text-foreground'>
                        {item.title}
                      </span>
                      {item.status === 'validado' && (
                        <Badge
                          variant='success'
                          className='h-4 rounded-full px-1.5 text-[9px]'
                        >
                          Validado
                        </Badge>
                      )}
                      {item.status === 'solicitado' && (
                        <Badge
                          variant='attention'
                          className='h-4 rounded-full px-1.5 text-[9px]'
                        >
                          Solicitado
                        </Badge>
                      )}
                      {item.status === 'nao_solicitado' && (
                        <Badge
                          variant='secondary'
                          className='h-4 rounded-full px-1.5 text-[9px]'
                        >
                          Não solicitado
                        </Badge>
                      )}
                      {item.pendencies && (
                        <Badge
                          variant='destructive'
                          className='h-4 rounded-full px-1.5 text-[9px]'
                        >
                          <Icon name='alert-circle' className='size-2.5' />
                          {item.pendencies} pendência
                        </Badge>
                      )}
                    </div>
                    <span className='truncate text-[10px] text-muted-foreground'>
                      {item.documentName || item.subtitle}
                    </span>
                  </div>
                </div>

                <div className='flex shrink-0 items-center gap-2 self-end md:self-center'>
                  <Button
                    variant={item.status === 'validado' ? 'brand' : 'outline'}
                    size='xs'
                    className='h-7 rounded-full bg-accent px-2 text-[10px] text-accent-foreground'
                  >
                    <Icon name={getChecklistActionIcon(item.status)} className='size-3' />
                    {getChecklistActionLabel(item.status)}
                  </Button>
                  <Button
                    variant='outline'
                    size='icon-xs'
                    aria-label={`Abrir ${item.title}`}
                    className='size-7 rounded-full bg-card text-muted-foreground'
                  >
                    <Icon name='arrow-right' className='size-3' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='flex flex-col gap-3 border-t border-border pt-3'>
          <h3 className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
            Itens complementares do caso
          </h3>
          <div className='flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3'>
            <span className='text-[10px] text-muted-foreground'>
              Nenhum item complementar adicionado. Itens complementares são específicos
              deste caso e exigem justificativa — não alteram o template de origem.
            </span>
            <Button
              variant='brand'
              size='xs'
              className='h-7 rounded-full bg-background text-[10px]'
            >
              <Icon name='plus' className='size-3' />
              Adicionar item
            </Button>
          </div>
        </div>
      </section>

      <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-xs'>
        <div className='flex items-center justify-between gap-4'>
          <h2 className='font-serif text-lg font-semibold text-foreground'>
            Dossiê Documental
          </h2>
          <Badge variant='secondary' className='h-5 rounded-full px-2 text-[10px]'>
            Não iniciado
          </Badge>
        </div>
        <p className='text-[11px] text-muted-foreground'>
          O dossiê é formado automaticamente pelos documentos validados assim que o
          checklist final for aprovado. É a base documental oficial da produção jurídica.
        </p>
        <div className='flex flex-col gap-1.5'>
          {[
            'Checklist aprovado',
            'Dossiê formado e aprovado',
            'Produção jurídica liberada',
          ].map((label, index) => (
            <div
              key={label}
              className='flex items-center justify-between rounded-md bg-muted/60 px-3 py-1.5 text-[11px] text-muted-foreground'
            >
              <span className='flex items-center gap-2'>
                <Icon
                  name={
                    index === 0 ? 'list-checks' : index === 1 ? 'file-text' : 'pencil'
                  }
                  className='size-3'
                />
                {label}
              </span>
              <Icon name='lock' className='size-3' />
            </div>
          ))}
        </div>
      </section>

      <section className='flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-xs'>
        <h2 className='font-serif text-lg font-semibold text-foreground'>
          Exceções Documentais
        </h2>
        <div className='flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground'>
          <Icon name='shield-check' className='size-3.5 text-primary' />
          Nenhuma exceção ativa neste caso.
        </div>
        <p className='text-[11px] text-muted-foreground'>
          Quando um documento não puder ser obtido, solicite exceção com justificativa. A
          aprovação é de outro perfil autorizado — o solicitante não aprova a própria
          exceção.
        </p>
        <Button
          variant='brand'
          size='xs'
          className='h-8 w-full rounded-full bg-background text-[11px]'
        >
          <Icon name='alert-triangle' className='size-3.5' />
          Solicitar exceção documental
        </Button>
      </section>

      <section className='flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-xs'>
        <h2 className='font-serif text-lg font-semibold text-foreground'>
          Atividade Documental
        </h2>
        <div className='relative flex flex-col gap-4 before:absolute before:inset-y-1 before:left-3 before:w-px before:bg-border'>
          {MOCK_ACTIVITIES.map((activity) => (
            <div key={activity.id} className='relative z-10 flex items-start gap-3'>
              <div className='flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background'>
                <Icon name={activity.icon} className='size-3 text-muted-foreground' />
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-xs font-semibold text-foreground'>
                  {activity.title}
                </span>
                <span className='text-[10px] text-muted-foreground'>
                  {activity.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
