import {
  CaseMemberRole,
  LegalCaseStatus,
} from '@hms/core/case-management/domain/structures'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { useAdminCaseSummaryPage } from './use-admin-case-summary-page'

const STATUS_LABELS = {
  [LegalCaseStatus.Documentation]: 'Documentação',
  [LegalCaseStatus.ReadyForLegalProduction]: 'Em andamento',
  [LegalCaseStatus.LegalProduction]: 'Em produção jurídica',
  [LegalCaseStatus.ProtocolDelivery]: 'Protocolo e entrega',
  [LegalCaseStatus.Execution]: 'Execução',
  [LegalCaseStatus.Closed]: 'Encerrado',
} as const

export const AdminCaseSummaryPage = ({ caseId }: { caseId: string }) => {
  const query = useAdminCaseSummaryPage(caseId)
  const legalCase = query.data
  if (query.isPending)
    return (
      <main className='py-10' aria-busy='true'>
        Carregando Caso…
      </main>
    )
  if (query.isError || !legalCase)
    return (
      <main className='space-y-4 py-10'>
        <p role='alert'>Não foi possível carregar este Caso.</p>
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        <Anchor route='adminCases'>Voltar aos Casos</Anchor>
      </main>
    )
  return (
    <main className='min-w-0 space-y-8 py-10'>
      <Anchor route='adminCases' className='text-primary underline underline-offset-4'>
        Voltar aos Casos
      </Anchor>
      <header className='space-y-3'>
        <p className='text-sm text-muted-foreground'>{legalCase.publicCode}</p>
        <h1 className='break-words font-serif text-3xl font-semibold'>
          {legalCase.title}
        </h1>
        <div className='flex flex-wrap gap-2'>
          <Badge variant='secondary'>{STATUS_LABELS[legalCase.status]}</Badge>
          <Badge variant='outline'>Somente leitura</Badge>
        </div>
      </header>
      <section aria-labelledby='case-summary-title'>
        <h2 id='case-summary-title' className='mb-4 font-serif text-xl font-semibold'>
          Visão geral
        </h2>
        <dl className='grid gap-5 sm:grid-cols-2'>
          <div>
            <dt className='text-sm text-muted-foreground'>Cliente</dt>
            <dd className='break-words'>{legalCase.clientName}</dd>
          </div>
          <div>
            <dt className='text-sm text-muted-foreground'>Área jurídica</dt>
            <dd>{legalCase.legalArea}</dd>
          </div>
          <div>
            <dt className='text-sm text-muted-foreground'>Tema jurídico</dt>
            <dd>{legalCase.legalTopic}</dd>
          </div>
          <div>
            <dt className='text-sm text-muted-foreground'>Última atualização</dt>
            <dd>{new Date(legalCase.updatedAt).toLocaleDateString('pt-BR')}</dd>
          </div>
        </dl>
      </section>
      <section aria-labelledby='case-summary-team-title'>
        <h2
          id='case-summary-team-title'
          className='mb-4 font-serif text-xl font-semibold'
        >
          Equipe do Caso
        </h2>
        {legalCase.team.length ? (
          <ul className='divide-y divide-border'>
            {legalCase.team.map((member) => (
              <li
                key={member.collaboratorId}
                className='flex flex-wrap items-center justify-between gap-3 py-3'
              >
                <span className='break-words'>{member.name}</span>
                <Badge variant='outline'>
                  {member.role === CaseMemberRole.Manager ? 'Gestor' : 'Colaborador'}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-muted-foreground'>Nenhum integrante vigente informado.</p>
        )}
      </section>
    </main>
  )
}
