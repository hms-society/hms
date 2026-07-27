import { useState } from 'react'
import { Link } from '@tanstack/react-router'

import { Button } from '#/ui/shadcn/button'
import { Input } from '#/ui/shadcn/input'

import { useSignIn } from '#/ui/identity/hooks'

export const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: signIn, isPending: loading, error } = useSignIn()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const email = formData.get('cpf-email')?.toString() ?? ''
    const password = formData.get('password')?.toString() ?? ''

    signIn({ email, password })
  }

  return (
    <main className='min-h-screen flex bg-background text-foreground font-sans'>
      <div className='hidden md:flex w-[45%] flex-col justify-between bg-[linear-gradient(225deg,rgba(10,45,48,0.95)_0%,#1B8C93_40%,#4B696B_70%,rgba(6,28,30,0.98)_100%)] p-12 lg:p-16'>
        <div>
          <span className='inline-block border-b-[2px] border-primary-foreground pb-0.5 font-serif text-[32px] font-medium text-primary-foreground'>
            HMS
          </span>
        </div>

        <div className='-mt-10 flex flex-col gap-6'>
          <span className='w-fit rounded-full border border-primary-foreground/40 px-5 py-2 font-sans text-[12px] font-semibold uppercase tracking-[0.15em] text-primary-foreground/90'>
            Bem-vindo
          </span>

          <h2 className='font-serif text-[42px] leading-[1.1] font-medium text-primary-foreground lg:text-[46px]'>
            Seus direitos,
            <br />
            <span className='text-[#E8D1B5]'>cuidados com calma.</span>
          </h2>

          <p className='max-w-[380px] font-sans text-[16px] leading-relaxed text-primary-foreground/80'>
            Acompanhe seu processo, converse com seu advogado e tire dúvidas quando
            precisar — sem juridiquês, sem complicação.
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
                CPF ou email:
              </label>

              <Input
                id='cpf-email'
                name='cpf-email'
                type='text'
                placeholder='Digite seu email ou CPF'
                required
                disabled={loading}
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

                <Link
                  to='/forgot-password'
                  className='font-sans text-[13px] font-bold text-brand-accent transition-opacity hover:opacity-80'
                >
                  Esqueci minha senha
                </Link>
              </div>

              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Sua senha'
                  required
                  disabled={loading}
                  className='h-12 rounded-full border-input bg-background px-5 pr-20 font-sans text-[14px] focus-visible:ring-ring'
                />

                <button
                  type='button'
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  className='absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer font-sans text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground'
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <Button
              type='submit'
              disabled={loading}
              className='mt-2 h-12 w-full rounded-full bg-brand font-sans text-[15px] font-bold text-brand-foreground shadow-none transition-opacity hover:opacity-90 disabled:opacity-50'
            >
              {loading ? 'Entrando...' : 'Entrar na plataforma'}
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

            <Button
              type='button'
              variant='outline'
              asChild
              className='h-12 w-full rounded-full border-input bg-transparent font-sans text-[15px] font-bold text-foreground shadow-none transition-colors hover:bg-muted'
            >
              <Link to={'/sign-up' as any}>Primeiro acesso?</Link>
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
