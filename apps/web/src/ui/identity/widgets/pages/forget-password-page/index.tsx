import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

import { useForgetPassword } from './use-forget-password-page'

export const ForgotPasswordPage = () => {
  const {
    email,
    error,
    isEmailSent,
    isLoading,
    resendTimer,
    handleEmailChange,
    handleResendEmail,
    handleSubmit,
  } = useForgetPassword()

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
            Recuperação
          </span>

          <h2 className='font-serif text-[42px] leading-[1.1] font-medium text-primary-foreground lg:text-[46px]'>
            Retome o acesso,
            <br />
            <span className='text-brand-accent'>sem complicação.</span>
          </h2>

          <p className='max-w-[380px] font-sans text-[16px] leading-relaxed text-primary-foreground/80'>
            Enviaremos instruções seguras para que você possa criar uma nova senha e
            voltar a acompanhar seus processos.
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
              Esqueceu sua senha?
            </h1>

            <p className='mt-1 font-sans text-[15px] leading-relaxed text-muted-foreground'>
              {isEmailSent
                ? 'Acabamos de enviar um link de recuperação para o seu email. Verifique sua caixa de entrada e spam.'
                : 'Digite o email associado à sua conta e enviaremos um link para você redefinir sua senha.'}
            </p>
          </div>

          {!isEmailSent ? (
            <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
              {error && (
                <div className='p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 font-sans'>
                  Ocorreu um erro ao tentar enviar o email. Tente novamente.
                </div>
              )}

              <div className='flex flex-col gap-2'>
                <label
                  htmlFor='email'
                  className='font-sans text-[14px] font-bold text-foreground'
                >
                  Email:
                </label>

                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={email}
                  onChange={handleEmailChange}
                  placeholder='Digite seu email'
                  required
                  disabled={isLoading}
                  className='h-12 rounded-full border-input bg-background px-5 font-sans text-[14px] focus-visible:ring-ring'
                />
              </div>

              <Button
                type='submit'
                disabled={isLoading}
                className='mt-2 h-12 w-full rounded-full bg-brand font-sans text-[15px] font-bold text-brand-foreground shadow-none transition-opacity hover:opacity-90 disabled:opacity-50'
              >
                {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
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
          ) : (
            <div className='flex flex-col gap-4'>
              {error && (
                <div className='p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 font-sans'>
                  Ocorreu um erro ao reenviar. Tente novamente em alguns segundos.
                </div>
              )}

              <Button
                type='button'
                onClick={handleResendEmail}
                disabled={resendTimer > 0 || isLoading}
                className='h-12 w-full rounded-full bg-brand font-sans text-[15px] font-bold text-brand-foreground shadow-none transition-opacity hover:opacity-90 disabled:opacity-50'
              >
                {isLoading
                  ? 'Enviando...'
                  : resendTimer > 0
                    ? `Reenviar email (${resendTimer}s)`
                    : 'Reenviar email'}
              </Button>

              <Button
                type='button'
                variant='outline'
                asChild
                className='h-12 w-full rounded-full border-input bg-transparent font-sans text-[15px] font-bold text-foreground shadow-none transition-colors hover:bg-muted'
              >
                <Anchor route='login'>Voltar para o login</Anchor>
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
