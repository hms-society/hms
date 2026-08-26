import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'

import {
  CASE_STAGES,
  CASE_TASKS,
  CASE_TEAM,
  CASE_TIMELINE,
  MOCK_ACTIVITIES,
  MOCK_CHECKLIST,
  TEAM_MEMBERS,
} from './case-page-data'
import { ChecklistDossierTab } from './checklist-dossier-tab'
import { OverviewTab } from './overview-tab'

export type CasoDetalheChecklistPageProps = {
  caseId?: string
}

export const CasoDetalheChecklistPage = ({ caseId }: CasoDetalheChecklistPageProps) => {
  const caseUuid = caseId ?? '00000000-0000-4000-8000-000000000089'
  const displayCaseId = 'CASO-20260703-0089'

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
              <Anchor route='lawyerCases'>Meus casos</Anchor>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayCaseId}</BreadcrumbPage>
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
                {displayCaseId}
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

      <Tabs defaultValue='visao-geral' className='w-full'>
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

        <TabsContent value='visao-geral' className='mt-3 flex flex-col gap-4'>
          <OverviewTab
            checklist={MOCK_CHECKLIST}
            tasks={CASE_TASKS}
            team={CASE_TEAM}
            timeline={CASE_TIMELINE}
          />
        </TabsContent>

        <TabsContent value='checklist' className='mt-3 flex flex-col gap-4'>
          <ChecklistDossierTab
            activities={MOCK_ACTIVITIES}
            caseId={caseUuid}
            checklist={MOCK_CHECKLIST}
            isReviewDisabled
            reviewDisabledReason='A revisão do gate será habilitada quando o detalhe carregar o checklist real deste caso.'
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
