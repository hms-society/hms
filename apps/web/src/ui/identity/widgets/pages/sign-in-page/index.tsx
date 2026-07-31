import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Anchor } from '@/ui/shared/widgets/components/anchor'

import { useSignInPage } from './use-sign-in-page'

export const SignInPage = () => {
  const {
    error,
    showPassword,
    isLoading,
    handleSubmit,
    handleTogglePasswordVisibility,
    register,
  } = useSignInPage()

  return (
    <main className='min-h-screen flex bg-background text-foreground font-sans'>
      <div className='auth-brand-panel hidden w-[45%] flex-col justify-between p-12 md:flex lg:p-16'>
        <div>
          <span className='inline-block border-b-[2px] border-auth-panel-foreground pb-0.5 font-serif text-[32px] font-medium text-auth-panel-foreground'>
            HMS
          </span>
        </div>

        <div className='-mt-10 flex flex-col gap-6'>
          <span className='w-fit rounded-full border border-auth-panel-foreground/40 px-5 py-2 font-sans text-[12px] font-semibold uppercase tracking-[0.15em] text-auth-panel-foreground/90'>
            Bem-vindo
          </span>

          <h2 className='font-serif text-[42px] leading-[1.1] font-medium text-auth-panel-foreground lg:text-[46px]'>
            Seus direitos,
            <br />
            <span className='text-auth-panel-accent'>cuidados com calma.</span>
          </h2>

          <p className='max-w-[380px] font-sans text-[16px] leading-relaxed text-auth-panel-foreground/80'>
            Acompanhe seu processo, converse com seu advogado e tire dúvidas quando
            precisar — sem juridiquês, sem complicação.
          </p>
        </div>

        <div className='flex items-center gap-4'>
          <div className='h-px flex-1 bg-auth-panel-foreground/20' />
          <p className='whitespace-nowrap font-sans text-[13px] tracking-wide text-auth-panel-foreground/60'>
            Trabalhista · Previdenciário
          </p>
          <div className='h-px flex-1 bg-auth-panel-foreground/20' />
        </div>
      </div>

      <div className='flex flex-1 flex-col items-center justify-center bg-background px-8 md:px-20'>
        <div className='flex w-full max-w-[420px] flex-col gap-8'>
          <div className='flex flex-col gap-2'>
            <p className='font-sans text-[12px] font-bold uppercase tracking-[0.18em] text-brand-accent'>
              Plataforma HMS
            </p>

            <h1 className='font-serif text-[36px] leading-tight font-medium text-foreground'>
              Que bom ter você aqui.
            </h1>

            <p className='mt-1 font-sans text-[15px] leading-relaxed text-muted-foreground'>
              Entre com seus dados para continuar. Se precisar de ajuda, estamos por
              perto.
            </p>
          </div>

          <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
            {error && (
              <div className='p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 font-sans'>
                {error.message}
              </div>
            )}

            <div className='flex flex-col gap-2'>
              <label
                htmlFor='cpf-email'
                className='font-sans text-[14px] font-bold text-foreground'
              >
                Email:
              </label>

              <Input
                id='cpf-email'
                type='email'
                placeholder='Digite seu email'
                defaultValue='admin@hmsadvogados.com.br'
                disabled={isLoading}
                {...register('email', { required: true })}
                className='h-12 rounded-full border-input bg-background px-5 font-sans text-[14px] focus-visible:ring-ring'
              />
            </div>

            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <label
                  htmlFor='password'
                  className='font-sans text-[14px] font-bold text-foreground'
                >
                  Senha
                </label>

                <Anchor
                  route='requestPasswordReset'
                  className='font-sans text-[13px] font-bold text-brand-accent transition-opacity hover:opacity-80'
                >
                  Esqueci minha senha
                </Anchor>
              </div>

              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Sua senha'
                  defaultValue='123456'
                  disabled={isLoading}
                  {...register('password', { required: true })}
                  className='h-12 rounded-full border-input bg-background px-5 pr-20 font-sans text-[14px] focus-visible:ring-ring'
                />

                <button
                  type='button'
                  onClick={handleTogglePasswordVisibility}
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className='absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer font-sans text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground'
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              disabled={isLoading}
              className='mt-2 h-12 w-full rounded-full bg-brand font-sans text-[15px] font-bold text-brand-foreground shadow-none transition-opacity hover:opacity-90 disabled:opacity-50'
            >
              {isLoading ? 'Entrando...' : 'Entrar na plataforma'}
            </Button>

            <div className='my-1 flex items-center gap-4'>
              <div className='h-px flex-1 bg-border' />
              <span className='font-sans text-[12px] uppercase tracking-wide text-muted-foreground'>
                OU
              </span>
              <div className='h-px flex-1 bg-border' />
            </div>

            <Button
              type='button'
              onClick={() => {}}
              className='h-12 w-full rounded-full bg-destructive font-sans text-[15px] font-bold text-destructive-foreground shadow-none transition-opacity hover:opacity-90'
            >
              Acessar com Google
            </Button>

            <p className='mt-2 text-center font-sans text-[14px] text-muted-foreground'>
              Quer conhecer melhor a plataforma?{' '}
              <a
                href='/#sobre'
                className='font-bold text-foreground transition-colors hover:text-brand'
              >
                Sobre nós
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
