import type { Client } from '@hms/core/identity/domain/entities'
import type { Intake } from '@hms/core/intake/domain/entities'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'

import { CollaboratorAvatar } from '@/ui/identity/widgets/components/collaborator-avatar'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'

import type { IntakeDetailsContentController } from '../use-intake-details-page'
import type { IntakeDetailsData } from '../use-intake-details-query'
import { IntakeEditDialog } from '../intake-edit-dialog'
import { ConfirmConsultationClosureDialog } from '@/ui/intake/widgets/components/confirm-consultation-closure-dialog'
const statusLabels: Record<Intake['status'], string> = {
  registered: 'Registrado',
  consultation_scheduling: 'Agendando consulta',
  consultation_scheduling_failed: 'Agendamento com falha',
  consultation_scheduled: 'Consulta agendada',
  consultation_completed: 'Consulta realizada',
  viability_registered: 'Viabilidade registrada',
  in_formalization: 'Em Formalização',
  contracted: 'Contratado',
  closed_without_contract: 'Encerrado sem contratação',
}

const originLabels: Record<Intake['origin'], string> = {
  direct: 'Entrada direta',
  referral: 'Indicação',
  website: 'Site',
  social_media: 'Redes sociais',
  other: 'Outra origem',
}

const contactChannelLabels: Record<Intake['contactChannel'], string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  phone: 'Telefone',
  in_person: 'Presencial',
}

const closureReasonLabels: Record<IntakeClosureReason, string> = {
  out_of_scope: 'Fora do escopo',
  legally_unviable: 'Inviável juridicamente',
  client_withdrew: 'Cliente desistiu',
  unable_to_contact: 'Sem contato',
  no_show: 'Não compareceu',
  referred: 'Encaminhado',
  other: 'Outro',
}

const lifecycleSteps = [
  { status: 'consultation_scheduled', label: 'Consulta agendada' },
  { status: 'consultation_completed', label: 'Consulta realizada' },
  { status: 'viability_registered', label: 'Viabilidade registrada' },
  { status: 'in_formalization', label: 'Formalização iniciada' },
  { status: 'contracted', label: 'Contratado' },
] as const

type TimelineEvent = {
  title: string
  description: string
  date: Date | string
  author: string
  tone?: 'default' | 'success' | 'attention' | 'destructive'
}

export function IntakeDetailsContent({
  data,
  isEditDialogOpen,
  isClosureDialogOpen,
  closureReason,
  closureNotes,
  canEdit,
  canClose,
  isClosing,
  isTransitioning,
  closeError,
  actionError,
  responsibleName,
  onEditDialogOpenChange,
  onClosureDialogOpenChange,
  onClosureReasonChange,
  onClosureNotesChange,
  onConfirmClosure,
  onStartFormalization,
  onConfirmContract,
}: IntakeDetailsContentController) {
  const { intake } = data
  const clientName = getClientName(data.client?.client)
  const timelineEvents = buildTimelineEvents(intake, responsibleName)

  return (
    <main
      className='flex w-full flex-col gap-5 pb-10'
      aria-labelledby='intake-details-title'
    >
      <Anchor
        route='intakes'
        className='inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:ring-3 focus-visible:ring-ring/50'
      >
        <Icon name='arrow-left' className='size-4' />
        Intakes
      </Anchor>

      <header className='flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between'>
        <div className='min-w-0'>
          <div className='mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1'>
            <h1
              id='intake-details-title'
              className='font-serif text-3xl font-semibold tracking-tight text-brand sm:text-4xl'
            >
              {formatDisplayId(intake.sequenceNumber)}
            </h1>
            <span className='text-xl text-muted-foreground'>·</span>
            <p className='text-lg font-semibold text-foreground'>{clientName}</p>
          </div>
          <p className='mt-2 text-sm text-muted-foreground'>
            Registrado em {formatDateTime(intake.createdAt)}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={!canEdit}
            title={
              canEdit ? undefined : 'Intakes em estado terminal não podem ser editados'
            }
            onClick={() => onEditDialogOpenChange(true)}
          >
            <Icon name='pencil' />
            Editar
          </Button>
          {canClose && (
            <Button
              type='button'
              variant='destructive'
              size='sm'
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              onClick={() => onClosureDialogOpenChange(true)}
            >
              <Icon name='door-open' />
              Encerrar sem contratação
            </Button>
          )}
        </div>
      </header>

      <section
        aria-label='Resumo do Intake'
        className='grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4'
      >
        <MetaItem icon='tag' label='Origem' value={originLabels[intake.origin]} />
        <MetaItem
          icon='message-square'
          label='Canal de contato'
          value={contactChannelLabels[intake.contactChannel]}
        />
        <div className='flex min-w-0 items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5'>
          <CollaboratorAvatar
            name={responsibleName}
            colorSeed={intake.responsibleId}
            className='size-8'
          />
          <div className='min-w-0'>
            <p className='text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground'>
              Atendente
            </p>
            <p className='truncate text-sm font-semibold text-foreground'>
              {responsibleName}
            </p>
          </div>
        </div>
        <MetaItem
          icon='calendar-clock'
          label='Status atual'
          value={statusLabels[intake.status]}
        />
      </section>

      <LifecyclePipeline status={intake.status} />

      <ClientCard data={data} />
      <DemandCard data={data} />

      {shouldShowConsultationCard(intake.status) && (
        <ConsultationCard intake={intake} consultationId={data.consultationId} />
      )}

      {intake.status === 'consultation_completed' && (
        <AttendanceCard consultationId={data.consultationId} />
      )}

      {intake.status === 'viability_registered' && (
        <ViabilityCard
          isPending={isTransitioning}
          onStartFormalization={onStartFormalization}
        />
      )}

      {intake.status === 'in_formalization' && (
        <FormalizationCard
          isPending={isTransitioning}
          onConfirmContract={onConfirmContract}
        />
      )}

      {intake.status === 'contracted' && <ContractedCard intake={intake} />}
      {intake.status === 'closed_without_contract' && <ClosedCard intake={intake} />}

      {actionError && (
        <p
          className='rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive'
          role='alert'
        >
          {actionError.message}
        </p>
      )}

      <section className='overflow-hidden rounded-xl border border-border bg-card shadow-sm'>
        <div className='border-b border-border px-5 py-4'>
          <h2 className='text-sm font-semibold text-foreground'>Atividade</h2>
        </div>
        <Timeline events={timelineEvents} />
      </section>

      {isEditDialogOpen ? (
        <IntakeEditDialog open intake={intake} onOpenChange={onEditDialogOpenChange} />
      ) : null}

      <ConfirmConsultationClosureDialog
        open={isClosureDialogOpen}
        isPending={isClosing}
        closureReason={closureReason}
        closureNotes={closureNotes}
        error={closeError}
        onOpenChange={onClosureDialogOpenChange}
        onClosureReasonChange={onClosureReasonChange}
        onClosureNotesChange={onClosureNotesChange}
        onConfirm={onConfirmClosure}
      />
    </main>
  )
}

function ClientCard({ data }: { data: IntakeDetailsData }) {
  const client = data.client?.client
  const name = getClientName(client)
  const taxId = client?.taxId.value
    ? maskTaxIdValue(client.taxId.value)
    : 'Documento não disponível'
  const phone = client?.phone ? formatPhoneValue(client.phone) : 'Telefone não disponível'
  const city = client?.address
    ? `${client.address.city} — ${client.address.state}`
    : 'Cidade não disponível'

  return (
    <Card className='border border-border shadow-sm'>
      <CardContent className='p-5 sm:p-6'>
        <div className='flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex min-w-0 items-center gap-3'>
            <CollaboratorAvatar
              name={name}
              colorSeed={data.intake.clientId}
              className='size-11'
            />
            <div className='min-w-0'>
              <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
                Cliente
              </p>
              <h2 className='truncate text-lg font-semibold text-foreground'>{name}</h2>
              <p className='text-sm text-muted-foreground'>{taxId} · Interessado</p>
            </div>
          </div>
          <Badge variant='secondary' className='w-fit'>
            {data.previousIntakes.length}{' '}
            {data.previousIntakes.length === 1 ? 'Intake anterior' : 'Intakes anteriores'}
          </Badge>
        </div>

        <dl className='mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-3'>
          <DetailField icon='phone' label='Telefone' value={phone} />
          <DetailField
            icon='mail'
            label='E-mail'
            value={client?.email ?? 'E-mail não disponível'}
          />
          <DetailField icon='map-pin' label='Cidade' value={city} />
        </dl>
      </CardContent>
    </Card>
  )
}

function DemandCard({ data }: { data: IntakeDetailsData }) {
  const { intake } = data

  return (
    <Card className='border-0 bg-brand text-brand-foreground shadow-sm'>
      <CardContent className='p-5 sm:p-6'>
        <div className='flex items-start justify-between gap-3'>
          <div>
            <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-brand-foreground/70'>
              Contexto da demanda
            </p>
            <h2 className='mt-1 font-serif text-xl font-semibold'>
              {data.legalArea?.name ?? 'Área jurídica não informada'}
            </h2>
          </div>
          <Badge className='border-white/20 bg-white/10 text-white'>
            {data.legalTopic?.name ?? 'Tema não informado'}
          </Badge>
        </div>
        <p className='mt-4 whitespace-pre-wrap text-sm leading-6 text-brand-foreground/90'>
          {intake.demandNotes ?? 'Nenhuma descrição registrada para esta demanda.'}
        </p>
        <div className='mt-4 flex flex-wrap items-center gap-2 text-xs text-brand-foreground/80'>
          <span className='inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5'>
            <Icon name='scale' className='size-3.5' />
            Urgência: {formatUrgency(intake.urgency)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ConsultationCard({
  intake,
  consultationId,
}: {
  intake: Intake
  consultationId?: string
}) {
  const isCompleted = intake.status === 'consultation_completed'

  return (
    <Card className='border border-border shadow-sm'>
      <CardContent className='p-5 sm:p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-start gap-3'>
            <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-highlight text-highlight-foreground'>
              <Icon name='calendar-check' className='size-4' />
            </span>
            <div className='min-w-0'>
              <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
                Consulta
              </p>
              <h2 className='mt-1 text-base font-semibold text-foreground'>
                {isCompleted ? 'Consulta realizada' : 'Consulta agendada'}
              </h2>
              <p className='mt-1 text-sm text-muted-foreground'>
                {isCompleted
                  ? 'O atendimento foi concluído e está disponível no módulo de Consulta.'
                  : 'O agendamento está vinculado a este Intake e será acompanhado pelo módulo de Consulta.'}
              </p>
            </div>
          </div>
          <Badge variant={isCompleted ? 'success' : 'info'}>
            {isCompleted ? 'Realizada' : 'Agendada'}
          </Badge>
        </div>

        <div className='mt-4 flex flex-col gap-3 rounded-lg bg-muted/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2 text-sm text-foreground'>
            <Icon name='info' className='size-4 text-primary' />
            <span>Os detalhes operacionais são mantidos pelo módulo de Consulta.</span>
          </div>
          {consultationId ? (
            <Button asChild type='button' variant='outline' size='sm'>
              <Anchor route='consultation' params={{ consultationId }}>
                Abrir consulta <Icon name='external-link' />
              </Anchor>
            </Button>
          ) : (
            <Button type='button' variant='outline' size='sm' disabled>
              Abrir consulta <Icon name='external-link' />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AttendanceCard({ consultationId }: { consultationId?: string }) {
  return (
    <Card className='border border-border shadow-sm'>
      <CardContent className='p-5 sm:p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
              Ficha de atendimento
            </p>
            <h2 className='mt-1 text-lg font-semibold text-foreground'>
              Ficha concluída
            </h2>
            <p className='mt-1 max-w-3xl text-sm leading-6 text-muted-foreground'>
              A ficha de atendimento foi finalizada e permanece disponível no módulo de
              Consulta.
            </p>
          </div>
        </div>
        <div className='mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3'>
          <span className='text-sm text-muted-foreground'>Consulta concluída</span>
          {consultationId ? (
            <Button asChild type='button' variant='outline' size='sm'>
              <Anchor route='consultationAttendanceForm' params={{ consultationId }}>
                Abrir ficha <Icon name='external-link' />
              </Anchor>
            </Button>
          ) : (
            <Button type='button' variant='outline' size='sm' disabled>
              Abrir ficha <Icon name='external-link' />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ViabilityCard({
  isPending,
  onStartFormalization,
}: {
  isPending: boolean
  onStartFormalization: () => void
}) {
  return (
    <Card className='border border-border shadow-sm'>
      <CardContent className='p-5 sm:p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
              Avaliação de viabilidade
            </p>
            <h2 className='mt-1 text-lg font-semibold text-foreground'>
              Viável — prosseguir com contratação
            </h2>
            <p className='mt-1 max-w-3xl text-sm leading-6 text-muted-foreground'>
              A viabilidade foi registrada após a Consulta. O próximo passo válido é
              iniciar a formalização.
            </p>
          </div>
          <Badge variant='success'>Registrada</Badge>
        </div>
        <div className='mt-4 flex flex-col gap-3 rounded-lg bg-highlight/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <span className='text-sm text-highlight-foreground'>
            Decisão operacional registrada no Intake.
          </span>
          <Button
            type='button'
            size='sm'
            onClick={onStartFormalization}
            disabled={isPending}
          >
            {isPending ? 'Iniciando...' : 'Iniciar formalização'}{' '}
            <Icon name='arrow-right' />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function FormalizationCard({
  isPending,
  onConfirmContract,
}: {
  isPending: boolean
  onConfirmContract: () => void
}) {
  return (
    <Card className='border border-border shadow-sm'>
      <CardContent className='p-5 sm:p-6'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground'>
              Formalização iniciada
            </p>
            <h2 className='mt-1 text-lg font-semibold text-foreground'>Em andamento</h2>
            <p className='mt-1 max-w-3xl text-sm leading-6 text-muted-foreground'>
              Os documentos e as assinaturas são acompanhados pelo módulo responsável pela
              formalização.
            </p>
          </div>
          <Badge variant='attention'>Em andamento</Badge>
        </div>
        <div className='mt-4 grid gap-2 sm:grid-cols-2'>
          <ReferenceRow
            icon='file-text'
            label='Pacote de formalização'
            value='Referência disponível no módulo responsável'
          />
          <ReferenceRow
            icon='check-circle-2'
            label='Progresso'
            value='Aguardando conclusão da formalização'
          />
        </div>
        <div className='mt-4 flex justify-end'>
          <Button
            type='button'
            size='sm'
            onClick={onConfirmContract}
            disabled={isPending}
          >
            {isPending ? 'Confirmando...' : 'Confirmar contratação'} <Icon name='check' />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ContractedCard({ intake }: { intake: Intake }) {
  return (
    <Card className='border border-emerald-200 bg-emerald-50/60 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20'>
      <CardContent className='flex items-start gap-3 p-5 sm:p-6'>
        <Icon name='check-circle-2' className='mt-0.5 size-5 shrink-0 text-emerald-600' />
        <div>
          <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300'>
            Desfecho
          </p>
          <h2 className='mt-1 text-lg font-semibold text-emerald-950 dark:text-emerald-100'>
            Contratado
          </h2>
          <p className='mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/80'>
            Este Intake foi concluído em {formatDateTime(intake.updatedAt)}.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ClosedCard({ intake }: { intake: Intake }) {
  return (
    <Card className='border border-destructive/20 bg-destructive/5 shadow-sm'>
      <CardContent className='flex items-start gap-3 p-5 sm:p-6'>
        <Icon name='door-open' className='mt-0.5 size-5 shrink-0 text-destructive' />
        <div>
          <p className='text-[11px] font-medium uppercase tracking-[0.12em] text-destructive/70'>
            Desfecho
          </p>
          <h2 className='mt-1 text-lg font-semibold text-destructive'>
            Encerrado sem contratação
          </h2>
          <p className='mt-1 text-sm text-destructive/80'>
            {intake.closureReason
              ? closureReasonLabels[intake.closureReason]
              : 'Motivo não informado'}{' '}
            · {formatDateTime(intake.closedAt ?? intake.updatedAt)}
          </p>
          {intake.closureNotes && (
            <p className='mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground'>
              {intake.closureNotes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LifecyclePipeline({ status }: { status: Intake['status'] }) {
  const currentIndex = getLifecycleIndex(status)

  return (
    <section
      className='overflow-x-auto rounded-xl border border-border bg-card px-4 py-4 shadow-sm sm:px-6'
      aria-label='Ciclo de vida do Intake'
    >
      <ol className='flex min-w-[650px] items-start'>
        {lifecycleSteps.map((step, index) => {
          const completed = currentIndex > index
          const active = currentIndex === index && status !== 'closed_without_contract'

          return (
            <li
              key={step.status}
              aria-current={active ? 'step' : undefined}
              className='relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center'
            >
              {index < lifecycleSteps.length - 1 && (
                <span
                  className={`absolute top-3 right-auto left-1/2 z-0 h-px w-full ${completed ? 'bg-primary' : 'bg-border'}`}
                  aria-hidden='true'
                />
              )}
              <span
                className={`relative z-10 flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold ${
                  completed
                    ? 'border-primary bg-primary text-primary-foreground'
                    : active
                      ? 'border-brand bg-brand text-brand-foreground ring-4 ring-highlight'
                      : 'border-input bg-card text-muted-foreground'
                }`}
              >
                {completed ? <Icon name='check' className='size-3.5' /> : index + 1}
              </span>
              <span
                className={`whitespace-nowrap text-xs leading-4 ${active ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
      {status === 'closed_without_contract' && (
        <p className='mt-4 text-center text-xs font-medium text-destructive'>
          O Intake foi encerrado sem contratação e não pode ser reaberto.
        </p>
      )}
    </section>
  )
}

function Timeline({ events }: { events: readonly TimelineEvent[] }) {
  return (
    <ol className='divide-y divide-border px-5' aria-label='Linha do tempo do Intake'>
      {events.map((event, index) => (
        <li
          key={`${event.title}-${String(event.date)}`}
          className='relative flex gap-4 py-5 first:pt-6 last:pb-6'
        >
          <div className='relative flex w-5 shrink-0 justify-center'>
            {index < events.length - 1 && (
              <span
                className='absolute top-5 bottom-[-1.25rem] w-px bg-border'
                aria-hidden='true'
              />
            )}
            <span
              className={`relative z-10 mt-0.5 size-2.5 rounded-full ring-4 ring-card ${getTimelineDotClass(event.tone)}`}
              aria-hidden='true'
            />
          </div>
          <div className='min-w-0 flex-1'>
            <div className='flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4'>
              <h3 className='text-sm font-semibold text-foreground'>{event.title}</h3>
              <time className='shrink-0 text-xs text-muted-foreground'>
                {formatDateTime(event.date)}
              </time>
            </div>
            <p className='mt-1 text-sm leading-6 text-muted-foreground'>
              {event.description}
            </p>
            <p className='mt-2 text-xs font-medium text-muted-foreground'>
              Por {event.author}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  value: string
}) {
  return (
    <div className='flex min-w-0 items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5'>
      <Icon name={icon} className='size-4 shrink-0 text-primary' />
      <div className='min-w-0'>
        <p className='text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground'>
          {label}
        </p>
        <p className='truncate text-sm font-semibold text-foreground'>{value}</p>
      </div>
    </div>
  )
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  value: string
}) {
  return (
    <div className='min-w-0'>
      <dt className='flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground'>
        <Icon name={icon} className='size-3.5' />
        {label}
      </dt>
      <dd className='mt-1 truncate text-sm font-medium text-foreground' title={value}>
        {value}
      </dd>
    </div>
  )
}

function ReferenceRow({
  icon,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  value: string
}) {
  return (
    <div className='flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-3'>
      <Icon name={icon} className='size-4 shrink-0 text-primary' />
      <div className='min-w-0'>
        <p className='text-xs font-semibold text-foreground'>{label}</p>
        <p className='truncate text-xs text-muted-foreground'>{value}</p>
      </div>
    </div>
  )
}

function buildTimelineEvents(intake: Intake, responsibleName: string): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      title: 'Intake criado',
      description: `Origem: ${originLabels[intake.origin]} · Canal: ${contactChannelLabels[intake.contactChannel]}`,
      date: intake.createdAt,
      author: responsibleName,
    },
  ]

  if (intake.status !== 'registered' && intake.status !== 'consultation_scheduling') {
    events.unshift({
      title: statusLabels[intake.status],
      description: getStatusEventDescription(intake.status),
      date: intake.updatedAt,
      author: responsibleName,
      tone: getStatusTone(intake.status),
    })
  }

  if (intake.status === 'closed_without_contract') {
    events.unshift({
      title: 'Encerramento sem contratação',
      description: intake.closureReason
        ? `Motivo: ${closureReasonLabels[intake.closureReason]}`
        : 'O Intake foi encerrado sem contratação.',
      date: intake.closedAt ?? intake.updatedAt,
      author: responsibleName,
      tone: 'destructive',
    })
  }

  return events
}

function getStatusEventDescription(status: Intake['status']) {
  switch (status) {
    case 'consultation_scheduling_failed':
      return 'O agendamento da Consulta precisa de uma nova tentativa.'
    case 'consultation_scheduled':
      return 'A Consulta foi vinculada ao Intake.'
    case 'consultation_completed':
      return 'A Consulta relacionada foi concluída.'
    case 'viability_registered':
      return 'A viabilidade foi registrada para a demanda.'
    case 'in_formalization':
      return 'A formalização foi iniciada.'
    case 'contracted':
      return 'A contratação foi confirmada.'
    case 'closed_without_contract':
      return 'O Intake foi encerrado sem contratação.'
    default:
      return 'O status do Intake foi atualizado.'
  }
}

function getStatusTone(status: Intake['status']): TimelineEvent['tone'] {
  if (status === 'contracted' || status === 'consultation_completed') return 'success'
  if (status === 'viability_registered') return 'attention'
  return 'default'
}

function getTimelineDotClass(tone: TimelineEvent['tone']) {
  if (tone === 'success') return 'bg-emerald-500'
  if (tone === 'attention') return 'bg-amber-500'
  if (tone === 'destructive') return 'bg-destructive'
  return 'bg-primary'
}

function getLifecycleIndex(status: Intake['status']) {
  if (status === 'contracted') return 4
  if (status === 'in_formalization') return 3
  if (status === 'viability_registered') return 2
  if (status === 'consultation_completed') return 1
  return 0
}

function shouldShowConsultationCard(status: Intake['status']) {
  return status !== 'registered'
}

function getClientName(client?: Client) {
  if (!client) return 'Cliente não identificado'
  return client.type === 'natural' ? client.name : (client.tradeName ?? client.legalName)
}

function maskTaxIdValue(value: string) {
  const digits = value.replace(/\D/g, '')
  const suffix = digits.slice(-2).padStart(2, '*')

  return digits.length > 11 ? `**.***.***/****-${suffix}` : `***.***.***-${suffix}`
}

function formatPhoneValue(value: string) {
  const digits = value.replace(/\D/g, '')

  if (digits.length >= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(-4)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(-4)}`
  }

  return value
}

function formatUrgency(urgency: Intake['urgency']) {
  if (urgency === 'urgent') return 'Urgente'
  if (urgency === 'high') return 'Alta'
  return 'Normal'
}

function formatDisplayId(sequenceNumber: number) {
  return `INT-${String(sequenceNumber).padStart(4, '0')}`
}

function formatDateTime(value?: Date | string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function IntakeDetailsLoading() {
  return (
    <main
      className='mx-auto w-full max-w-[1180px] space-y-5'
      aria-label='Carregando Intake'
    >
      <Skeleton className='h-5 w-24' />
      <div className='border-b border-border pb-5'>
        <Skeleton className='h-3 w-32' />
        <Skeleton className='mt-3 h-10 w-80 max-w-full' />
        <Skeleton className='mt-3 h-4 w-64 max-w-full' />
      </div>
      <Skeleton className='h-24 w-full rounded-xl' />
      <Skeleton className='h-24 w-full rounded-xl' />
      <Skeleton className='h-32 w-full rounded-xl' />
      <Skeleton className='h-72 w-full rounded-xl' />
    </main>
  )
}
