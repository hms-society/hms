import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

import { useResetPasswordPage } from './use-reset-password-page'

export const ResetPasswordPage = () => {
  const {
    confirmPassword,
    errorMessage,
    handleConfirmPasswordChange,
    handlePasswordChange,
    handleSubmit,
    handleTogglePasswordVisibility,
    isLoading,
    password,
    showPassword,
    status,
  } = useResetPasswordPage()

  return (
    <main className='min-h-screen flex bg-background text-foreground font-sans'>
      <div className='hidden md:flex w-[45%] flex-col justify-between bg-brand p-12 lg:p-16'>
        <div>
          <span className='inline-block border-b-[2px] border-primary-foreground pb-0.5 font-serif text-[32px] font-medium text-primary-foreground'>
            HMS
          </span>
        </div>

        <div className='-mt-10 flex flex-col gap-6'>
          <span className='w-fit rounded-full border border-primary-foreground/40 px-5 py-2 font-sans text-[12px] font-semibold uppercase tracking-[0.15em] text-primary-foreground/90'>
            Segurança
          </span>

          <h2 className='font-serif text-[42px] leading-[1.1] font-medium text-primary-foreground lg:text-[46px]'>
            Nova senha,
            <br />
            <span className='text-brand-accent'>novo acesso.</span>
          </h2>

          <p className='max-w-[380px] font-sans text-[16px] leading-relaxed text-primary-foreground/80'>
            Crie uma senha forte e segura para proteger suas informações e continuar
            acompanhando seus processos.
          </p>
        </div>

        <div className='flex items-center gap-4'>
          <div className='h-px flex-1 bg-primary-foreground/20' />
          <p className='whitespace-nowrap font-sans text-[13px] tracking-wide text-primary-foreground/60'>
            Trabalhista · Previdenciário
          </p>
          <div className='h-px flex-1 bg-primary-foreground/20' />
        </div>
      </div>

      <div className='flex flex-1 flex-col items-center justify-center bg-background px-8 md:px-20'>
        <div className='flex w-full max-w-[420px] flex-col gap-8'>
          <div className='flex flex-col gap-2'>
            <p className='font-sans text-[12px] font-bold uppercase tracking-[0.18em] text-brand-accent'>
              Plataforma HMS
            </p>

            <h1 className='font-serif text-[36px] leading-tight font-medium text-foreground'>
              Redefinir senha
            </h1>

            <p className='mt-1 font-sans text-[15px] leading-relaxed text-muted-foreground'>
              {status === 'success'
                ? 'Sua senha foi atualizada com sucesso. Redirecionando...'
                : 'Digite sua nova senha abaixo.'}
            </p>
          </div>

          {status !== 'success' && (
            <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
              {status === 'error' && (
                <div className='p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 font-sans'>
                  {errorMessage}
                </div>
              )}

              <div className='flex flex-col gap-2'>
                <label
                  htmlFor='password'
                  className='font-sans text-[14px] font-bold text-foreground'
                >
                  Nova Senha
                </label>

                <div className='relative'>
                  <Input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder='Digite a nova senha'
                    required
                    disabled={isLoading}
                    className='h-12 rounded-full border-input bg-background px-5 pr-20 font-sans text-[14px] focus-visible:ring-ring'
                  />
                  <button
                    type='button'
                    onClick={handleTogglePasswordVisibility}
                    disabled={isLoading}
                    className='absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer font-sans text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground'
                  >
                    {showPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                <label
                  htmlFor='confirmPassword'
                  className='font-sans text-[14px] font-bold text-foreground'
                >
                  Confirmar Nova Senha
                </label>

                <div className='relative'>
                  <Input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder='Confirme a nova senha'
                    required
                    disabled={isLoading}
                    className='h-12 rounded-full border-input bg-background px-5 pr-20 font-sans text-[14px] focus-visible:ring-ring'
                  />
                </div>
              </div>

              <Button
                type='submit'
                disabled={isLoading}
                className='mt-2 h-12 w-full rounded-full bg-brand font-sans text-[15px] font-bold text-brand-foreground shadow-none transition-opacity hover:opacity-90 disabled:opacity-50'
              >
                {isLoading ? 'Salvando...' : 'Salvar nova senha'}
              </Button>

              <div className='my-1 flex items-center gap-4'>
                <div className='h-px flex-1 bg-border' />
              </div>

              <Button
                type='button'
                variant='outline'
                asChild
                className='h-12 w-full rounded-full border-input bg-transparent font-sans text-[15px] font-bold text-foreground shadow-none transition-colors hover:bg-muted'
              >
                <Anchor route='login'>Voltar para o login</Anchor>
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
