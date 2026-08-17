import {
  ExpertiseGroup,
  Field,
} from '@/ui/identity/widgets/components/collaborator-expertise-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/shadcn/alert-dialog'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Input } from '@/ui/shadcn/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/shadcn/select'
import { Icon } from '@/ui/shared/widgets/components/icon'

import {
  useCollaboratorRegisterDialog,
  type CollaboratorRegisterDialogProps,
} from './use-collaborator-register-dialog'

export type { CollaboratorRegisterDialogProps } from './use-collaborator-register-dialog'

export const CollaboratorRegisterDialog = (props: CollaboratorRegisterDialogProps) => {
  const {
    fields,
    form,
    isLoadingLegalAreas,
    isLegalProfile,
    isRegisteringCollaborator,
    legalAreas,
    legalAreasError,
    legalAreasUnavailable,
    legalTopicsUnavailable,
    pendingProfile,
    profile,
    registerCollaboratorError,
    requestErrorRef,
    selectedExpertises,
    onSubmit,
    handleAddExpertise,
    handleAreaChange,
    handleClose,
    handleConfirmProfileChange,
    handleOpenChange,
    handlePendingProfileChange,
    handleProfileChange,
    handleRemoveExpertise,
    handleTopicAvailabilityChange,
    handleTopicsChange,
  } = useCollaboratorRegisterDialog(props)
  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-[14px] p-0 sm:max-w-[760px] [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:size-8'>
        <DialogHeader className='shrink-0 border-b border-border px-6 py-5 pr-16'>
          <DialogTitle className='font-serif text-xl font-semibold text-foreground'>
            Novo colaborador
          </DialogTitle>
          <DialogDescription className='sr-only'>
            Envie um convite e defina o perfil de acesso da pessoa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className='flex min-h-0 flex-1 flex-col'>
          <div className='min-h-0 flex-1 space-y-[18px] overflow-y-auto px-6 py-5'>
            <section className='space-y-2'>
              <h3 className='text-[11px] font-bold tracking-[0.08em] text-muted-foreground'>
                DADOS PESSOAIS
              </h3>
              <div className='space-y-3'>
                <Field
                  label='Nome profissional'
                  error={form.formState.errors.professionalName?.message}
                >
                  <Input
                    className='rounded-md px-3 text-[13px]'
                    aria-invalid={Boolean(form.formState.errors.professionalName)}
                    {...form.register('professionalName')}
                  />
                </Field>
                <Field label='E-mail' error={form.formState.errors.email?.message}>
                  <Input
                    className='rounded-md px-3 text-[13px]'
                    type='email'
                    aria-invalid={Boolean(form.formState.errors.email)}
                    {...form.register('email')}
                  />
                  <p className='mt-1 text-[11px] text-muted-foreground'>
                    Será usado para login e receberá o link de definição de senha
                  </p>
                </Field>
              </div>
            </section>
            <div className='h-px bg-border' />
            <section className='space-y-2'>
              <h3 className='text-[11px] font-bold tracking-[0.08em] text-muted-foreground'>
                PERFIL E FUNÇÃO
              </h3>
              <div className='grid gap-3 sm:grid-cols-2'>
                <Field label='Perfil' error={form.formState.errors.profile?.message}>
                  <Select value={profile} onValueChange={handleProfileChange}>
                    <SelectTrigger
                      className='w-full rounded-md text-[13px]'
                      aria-label='Perfil'
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries({
                        admin: 'Administrador',
                        attendant: 'Atendente',
                        lawyer: 'Advogado',
                        paralegal: 'Paralegal',
                        supervisor: 'Supervisor',
                      }).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label='Cargo' error={form.formState.errors.jobTitle?.message}>
                  <Input
                    className='rounded-md px-3 text-[13px]'
                    {...form.register('jobTitle')}
                  />
                </Field>
              </div>
            </section>
            <div className='h-px bg-border' />
            {isLegalProfile && fields.length > 0 && (
              <section className='space-y-2.5'>
                <h3 className='text-[11px] font-bold tracking-[0.08em] text-muted-foreground'>
                  ÁREAS E TEMAS DE ATUAÇÃO *
                </h3>
                {isLoadingLegalAreas && (
                  <p role='status' className='text-xs text-muted-foreground'>
                    Carregando áreas jurídicas…
                  </p>
                )}
                {legalAreasError && (
                  <p role='alert' className='text-xs text-destructive'>
                    Não foi possível carregar as áreas jurídicas. Tente novamente mais
                    tarde.
                  </p>
                )}
                <fieldset className='space-y-3'>
                  <legend className='sr-only'>Especialidades jurídicas</legend>
                  {fields.map((field, index) => (
                    <ExpertiseGroup
                      key={field.id}
                      control={form.control}
                      index={index}
                      legalAreas={legalAreas}
                      selectedAreaIds={selectedExpertises.map(
                        (expertise) => expertise.legalAreaId,
                      )}
                      disabled={legalAreasUnavailable}
                      canRemove={fields.length > 1}
                      onRemove={() => handleRemoveExpertise(index)}
                      onAreaChange={(value) => handleAreaChange(index, value)}
                      onTopicsChange={(topicIds) => handleTopicsChange(index, topicIds)}
                      areaError={
                        form.formState.errors.legalExpertises?.[index]?.legalAreaId
                          ?.message
                      }
                      topicError={
                        form.formState.errors.legalExpertises?.[index]?.legalTopicIds
                          ?.message
                      }
                      onAvailabilityChange={handleTopicAvailabilityChange}
                    />
                  ))}
                </fieldset>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='rounded-full px-3 text-xs text-primary'
                  onClick={handleAddExpertise}
                  disabled={legalAreasUnavailable || fields.length >= legalAreas.length}
                >
                  <Icon name='plus' />
                  Adicionar área de atuação
                </Button>
              </section>
            )}
            {registerCollaboratorError && (
              <p
                ref={requestErrorRef}
                role='alert'
                tabIndex={-1}
                className='text-xs text-destructive'
              >
                {registerCollaboratorError.message}
              </p>
            )}
          </div>
          <DialogFooter className='mx-0 mb-0 shrink-0 rounded-none border-border bg-transparent px-6 py-4'>
            <Button type='button' variant='outline' size='sm' onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type='submit'
              size='sm'
              disabled={
                isRegisteringCollaborator ||
                !form.formState.isValid ||
                legalAreasUnavailable ||
                legalTopicsUnavailable
              }
            >
              {isRegisteringCollaborator ? 'Enviando…' : 'Criar colaborador'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertDialog
        open={Boolean(pendingProfile)}
        onOpenChange={handlePendingProfileChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar especialidades?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao trocar para um perfil administrativo, as áreas e temas selecionados serão
              removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter especialidades</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmProfileChange}>
              Descartar e trocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
