import type { ChangeEvent } from 'react'

import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Anchor } from '@/ui/shared/widgets/components/anchor'
import { Icon } from '@/ui/shared/widgets/components/icon'

import { useCollaboratorInvitePage } from './use-collaborator-invite-page'

export function CollaboratorInvitePage() {
  const {
    confirmPassword,
    errorMessage,
    handleConfirmPasswordChange,
    handlePasswordChange,
    handleSubmit,
    handleTogglePasswordVisibility,
    hasCheckedSession,
    isLoading,
    password,
    session,
    showPassword,
    status,
  } = useCollaboratorInvitePage()

  const isInviteUnavailable = hasCheckedSession && !session

  return (
    <main className='flex min-h-screen bg-background font-sans text-foreground'>
      <section className='auth-brand-panel hidden w-[36.1%] flex-col justify-between px-16 py-16 md:flex'>
        <div>
          <span className='inline-block border-b-2 border-auth-panel-foreground pb-1 font-serif text-[34px] font-medium text-auth-panel-foreground'>
            HMS
          </span>
        </div>

        <div className='-mt-24 flex max-w-[392px] flex-col gap-6'>
          <p className='font-sans text-xs font-bold tracking-[0.2em] text-auth-panel-accent'>
            CONVITE DE EQUIPE
          </p>
          <h1 className='font-serif text-[52px] leading-[1.04] font-medium text-auth-panel-foreground'>
            Seu acesso à HMS começa aqui.
          </h1>
          <p className='text-base leading-relaxed text-auth-panel-foreground/80'>
            Você recebeu um convite para fazer parte da equipe. Defina sua senha e entre
            em um espaço feito para o trabalho jurídico acontecer com clareza.
          </p>
        </div>

        <div className='flex items-center gap-4 text-[11px] font-semibold tracking-[0.12em] text-auth-panel-foreground/60'>
          <span className='h-px w-12 bg-auth-panel-accent' />
          IDENTIDADE · ACESSO SEGURO
        </div>
      </section>

      <section className='flex flex-1 items-center justify-center px-6 py-12 md:px-16'>
        <div className='w-full max-w-[500px]'>
          <p className='text-xs font-bold tracking-[0.2em] text-brand-accent'>
            BEM-VINDO À EQUIPE
          </p>
          <h2 className='mt-6 font-serif text-[42px] leading-tight font-medium text-foreground'>
            Defina sua senha
          </h2>
          <p className='mt-5 text-[15px] leading-relaxed text-muted-foreground'>
            Seu convite foi confirmado. Crie uma senha para proteger o seu acesso à
            plataforma.
          </p>

          {isInviteUnavailable ? (
            <InviteErrorState message='Link de convite inválido ou expirado.' />
          ) : status === 'success' ? (
            <p role='status' className='mt-12 text-sm text-brand'>
              Senha criada. Redirecionando para a HMS…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className='mt-12 flex flex-col gap-5'>
              {status === 'error' && <InviteErrorState message={errorMessage} />}
              <PasswordField
                id='invite-password'
                label='Nova senha'
                placeholder='Digite sua senha'
                value={password}
                visible={showPassword}
                disabled={isLoading}
                onChange={handlePasswordChange}
                onToggleVisibility={handleTogglePasswordVisibility}
              />
              <PasswordField
                id='invite-confirm-password'
                label='Confirmar senha'
                placeholder='Repita sua senha'
                value={confirmPassword}
                visible={showPassword}
                disabled={isLoading}
                onChange={handleConfirmPasswordChange}
                onToggleVisibility={handleTogglePasswordVisibility}
              />
              <p className='text-xs text-muted-foreground'>
                Use pelo menos 6 caracteres.
              </p>
              <Button
                type='submit'
                disabled={isLoading || isInviteUnavailable}
                className='mt-2 h-11 w-full'
              >
                {isLoading ? 'Salvando…' : 'Criar minha senha'}
              </Button>
              <p className='text-center text-xs text-muted-foreground'>
                Sua senha é pessoal e não será compartilhada com a equipe.
              </p>
              <Button type='button' variant='outline' asChild className='h-11 w-full'>
                <Anchor route='login'>Voltar para o login</Anchor>
              </Button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

type InviteErrorStateProps = {
  message: string
}

function InviteErrorState({ message }: InviteErrorStateProps) {
  return (
    <p
      role='alert'
      className='mt-8 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive'
    >
      {message || 'Não foi possível concluir o convite.'}
    </p>
  )
}

type PasswordFieldProps = {
  id: string
  label: string
  placeholder: string
  value: string
  visible: boolean
  disabled: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onToggleVisibility: () => void
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  visible,
  disabled,
  onChange,
  onToggleVisibility,
}: PasswordFieldProps) {
  return (
    <div className='space-y-2'>
      <label htmlFor={id} className='text-sm font-bold text-foreground'>
        {label}
      </label>
      <div className='relative'>
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete='new-password'
          disabled={disabled}
          className='h-14 rounded-2xl bg-card px-[18px] pr-12'
        />
        <button
          type='button'
          aria-label={
            visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`
          }
          onClick={onToggleVisibility}
          disabled={disabled}
          className='absolute top-1/2 right-4 -translate-y-1/2 rounded-md p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
        >
          <Icon name='eye' className='size-[18px]' />
        </button>
      </div>
    </div>
  )
}
