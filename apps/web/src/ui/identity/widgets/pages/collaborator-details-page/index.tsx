import { Link } from '@tanstack/react-router'

import { CollaboratorAvatar } from '@/ui/identity/widgets/components/collaborator-avatar'
import { CollaboratorEditDialog } from '@/ui/identity/widgets/components/collaborator-edit-dialog'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { PageTitle } from '@/ui/shared/widgets/components/page-title'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'

import { DetailField } from './detail-field'
import { DetailRow } from './detail-row'
import { DetailsCard } from './details-card'
import { DetailsState } from './details-state'
import { TabItem } from './tab-item'
import { useCollaboratorDetailsPage } from './use-collaborator-details-page'

type CollaboratorDetailsPageProps = {
  collaboratorId: string
}

export const CollaboratorDetailsPage = ({
  collaboratorId,
}: CollaboratorDetailsPageProps) => {
  const {
    collaborator,
    collaboratorError,
    deactivateCollaboratorError,
    isCollaboratorDisabled,
    isDeactivateDialogOpen,
    isDeactivatingCollaborator,
    isEditDialogOpen,
    isLoadingCollaborator,
    isReactivateDialogOpen,
    isReactivatingCollaborator,
    reactivateCollaboratorError,
    refetch,
    formatCollaboratorLastAccess,
    getLegalExpertises,
    getProfileLabel,
    getStatusLabel,
    handleConfirmDeactivate,
    handleConfirmReactivate,
    handleDeactivateDialogOpenChange,
    handleEditDialogOpenChange,
    handleEditSuccess,
    handleOpenDeactivate,
    handleOpenEdit,
    handleOpenReactivate,
    handleReactivateDialogOpenChange,
  } = useCollaboratorDetailsPage(collaboratorId)

  if (isLoadingCollaborator) {
    return <DetailsState message='Carregando dados do colaborador...' />
  }

  if (collaboratorError || !collaborator) {
    return (
      <DetailsState
        actionLabel='Tentar novamente'
        message='Não foi possível carregar os dados do colaborador.'
        onAction={() => void refetch()}
      />
    )
  }

  const legalExpertises = getLegalExpertises(collaborator)
  const statusLabel = getStatusLabel(collaborator.status)

  return (
    <main
      className='mx-auto w-full space-y-6'
      aria-labelledby='collaborator-details-title'
    >
      <Button asChild variant='link' className='h-auto px-0 text-brand'>
        <Link to='/colaboradores'>
          <Icon name='arrow-left' /> Voltar
        </Link>
      </Button>

      <section className='flex flex-col gap-5 rounded-2xl bg-primary px-6 py-5 text-primary-foreground shadow-sm lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex items-center gap-4'>
          <CollaboratorAvatar
            name={collaborator.professionalName}
            colorSeed={collaborator.collaboratorId}
            className='size-16 text-xl'
          />
          <div className='min-w-0'>
            <PageTitle
              id='collaborator-details-title'
              className='text-2xl font-semibold text-primary-foreground'
            >
              {collaborator.professionalName}
            </PageTitle>
            <p className='mt-1 text-sm text-primary-foreground/70'>
              {getProfileLabel(collaborator.profile)}
              {collaborator.jobTitle ? ` · ${collaborator.jobTitle}` : ''}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='secondary'
            size='sm'
            className='min-w-32 bg-primary-foreground text-primary shadow-sm hover:bg-primary-foreground/90 disabled:pointer-events-auto disabled:opacity-100 disabled:bg-primary-foreground/90 disabled:text-primary/80'
            onClick={handleOpenEdit}
          >
            <Icon name='pencil' className='size-4' /> Editar perfil
          </Button>
          {isCollaboratorDisabled ? (
            <Button
              variant='secondary'
              size='sm'
              className='min-w-40 bg-primary-foreground text-primary shadow-sm hover:bg-primary-foreground/90 disabled:pointer-events-auto disabled:opacity-100 disabled:bg-primary-foreground/90 disabled:text-primary/80'
              disabled={isReactivatingCollaborator}
              onClick={handleOpenReactivate}
            >
              <Icon name='refresh-cw' className='size-4' />
              {isReactivatingCollaborator ? 'Reativando…' : 'Reativar colaborador'}
            </Button>
          ) : (
            <Button
              variant='destructive'
              size='sm'
              className='min-w-24 border border-destructive-foreground/20 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive-foreground/40'
              disabled={collaborator.status !== 'active' || isDeactivatingCollaborator}
              onClick={handleOpenDeactivate}
            >
              {isDeactivatingCollaborator ? 'Inativando…' : 'Inativar'}
            </Button>
          )}
        </div>
      </section>

      <nav
        className='overflow-x-auto border-b border-border'
        aria-label='Abas do colaborador'
      >
        <div className='flex min-w-max gap-6'>
          <TabItem icon='user' label='Visão geral' active />
          <TabItem icon='clipboard-list' label='Intakes' />
          <TabItem icon='briefcase-business' label='Casos' />
          <TabItem icon='shield-check' label='Permissões temporárias' />
          <TabItem icon='history' label='Auditoria' />
        </div>
      </nav>

      <section className='grid gap-5 xl:grid-cols-2'>
        <DetailsCard
          title='Dados de contato'
          description='Informações usadas para login, comunicação interna e identificação administrativa.'
        >
          <div className='grid gap-3 sm:grid-cols-2'>
            <DetailField label='Telefone institucional' value='Não informado' />
            <DetailField label='E-mail corporativo' value={collaborator.email} />
            <DetailField
              label='Perfil técnico'
              value={getProfileLabel(collaborator.profile)}
              tone='teal'
            />
            <DetailField
              label='Cargo/função'
              value={collaborator.jobTitle ?? 'Não informado'}
              tone='teal'
            />
          </div>
        </DetailsCard>

        <DetailsCard
          title='Controle de acesso'
          description='Estado da conta e pontos de auditoria que exigem atenção administrativa.'
        >
          <div className='space-y-2'>
            <DetailRow label='Status da conta' value={statusLabel} />
            <DetailRow label='Permissão temporária' value='Nenhuma ativa' />
            <DetailRow
              label='Último acesso'
              value={formatCollaboratorLastAccess(collaborator.lastAccessAt)}
            />
          </div>
        </DetailsCard>

        <DetailsCard
          title='Atuação jurídica'
          description='Áreas e temas em que o colaborador pode ser vinculado a intakes, consultas e casos jurídicos.'
          className='xl:col-span-2'
        >
          {legalExpertises.length > 0 ? (
            <div className='divide-y divide-border'>
              {legalExpertises.map(({ areaName, topicNames }) => (
                <div
                  key={areaName}
                  className='flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6'
                >
                  <div className='flex min-w-44 items-start gap-3'>
                    <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary'>
                      <Icon name='scale' className='size-4' />
                    </span>
                    <div>
                      <p className='text-sm font-semibold text-foreground'>{areaName}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {topicNames.length === 1
                          ? '1 tema jurídico'
                          : `${topicNames.length} temas jurídicos`}
                      </p>
                    </div>
                  </div>
                  <div className='flex flex-1 flex-wrap gap-2 sm:justify-end'>
                    {topicNames.length > 0 ? (
                      topicNames.map((topicName) => (
                        <Badge
                          key={topicName}
                          variant='outline'
                          className='bg-background'
                        >
                          {topicName}
                        </Badge>
                      ))
                    ) : (
                      <span className='text-sm text-muted-foreground'>
                        Nenhum tema jurídico vinculado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Nenhuma área jurídica vinculada.
            </p>
          )}
        </DetailsCard>
      </section>

      <AlertDialog
        open={isDeactivateDialogOpen}
        onOpenChange={handleDeactivateDialogOpenChange}
      >
        <AlertDialogContent className='max-w-[calc(100%-2rem)] gap-0 p-0 sm:max-w-[480px]'>
          <AlertDialogHeader className='place-items-start gap-2 p-6 text-left sm:grid-cols-[auto_1fr]'>
            <AlertDialogMedia className='bg-destructive/10 text-destructive'>
              <Icon name='user-x' />
            </AlertDialogMedia>
            <AlertDialogTitle className='font-serif text-2xl text-brand'>
              Inativar colaborador?
            </AlertDialogTitle>
            <AlertDialogDescription className='sm:col-start-2'>
              Essa ação suspenderá o acesso de {collaborator.professionalName} à HMS.
            </AlertDialogDescription>
            {deactivateCollaboratorError && (
              <p role='alert' className='text-sm text-destructive sm:col-start-2'>
                {deactivateCollaboratorError instanceof Error
                  ? deactivateCollaboratorError.message
                  : 'Não foi possível inativar o colaborador.'}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className='m-0 rounded-none bg-muted/50 p-4'>
            <AlertDialogCancel disabled={isDeactivatingCollaborator}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeactivatingCollaborator}
              onClick={(event) => void handleConfirmDeactivate(event)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeactivatingCollaborator ? 'Processando…' : 'Inativar colaborador'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isReactivateDialogOpen}
        onOpenChange={handleReactivateDialogOpenChange}
      >
        <AlertDialogContent className='max-w-[calc(100%-2rem)] gap-0 p-0 sm:max-w-[480px]'>
          <AlertDialogHeader className='place-items-start gap-2 p-6 text-left sm:grid-cols-[auto_1fr]'>
            <AlertDialogMedia className='bg-primary/10 text-primary'>
              <Icon name='refresh-cw' />
            </AlertDialogMedia>
            <AlertDialogTitle className='font-serif text-2xl text-brand'>
              Reativar colaborador?
            </AlertDialogTitle>
            <AlertDialogDescription className='sm:col-start-2'>
              O acesso de {collaborator.professionalName} à HMS será reativado.
            </AlertDialogDescription>
            {reactivateCollaboratorError && (
              <p role='alert' className='text-sm text-destructive sm:col-start-2'>
                {reactivateCollaboratorError instanceof Error
                  ? reactivateCollaboratorError.message
                  : 'Não foi possível reativar o colaborador.'}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className='m-0 rounded-none bg-muted/50 p-4'>
            <AlertDialogCancel disabled={isReactivatingCollaborator}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isReactivatingCollaborator}
              onClick={(event) => void handleConfirmReactivate(event)}
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            >
              {isReactivatingCollaborator ? 'Processando…' : 'Reativar colaborador'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditDialogOpen && (
        <CollaboratorEditDialog
          open={isEditDialogOpen}
          collaborator={collaborator}
          onOpenChange={handleEditDialogOpenChange}
          onSuccess={handleEditSuccess}
        />
      )}
    </main>
  )
}
