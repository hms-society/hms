import { Check, KeyRound, Timer } from 'lucide-react'

import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { OtpCodeInput } from './otp-code-input'
import { useOtpVerificationStep } from './use-otp-verification-step'

export type { OtpVerificationStepProps } from './use-otp-verification-step'
import type { OtpVerificationStepProps } from './use-otp-verification-step'

export const OtpVerificationStep = (props: OtpVerificationStepProps) => {
  const {
    canResend,
    canVerify,
    handleCodeChange,
    handleResend,
    handleVerify,
    isExpired,
    isPending,
    remainingTimeLabel,
    resendTimeLabel,
  } = useOtpVerificationStep(props)

  return (
    <main className='flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6'>
      <Card className='w-full max-w-xl overflow-hidden border border-border shadow-md'>
        <CardHeader className='gap-4 p-8 pb-0'>
          <div className='flex items-center gap-2 text-accent-foreground'>
            <KeyRound aria-hidden='true' className='size-4 text-brand-accent' />
            <p className='text-xs font-bold tracking-widest'>CÓDIGO DE USO ÚNICO</p>
          </div>
          <div className='space-y-2'>
            <h1 className='font-serif text-3xl font-semibold leading-tight tracking-tight'>
              Digite o código recebido
            </h1>
            <p className='max-w-md text-sm leading-6 text-muted-foreground'>
              Enviamos um código de seis dígitos para seu e-mail. Use-o para continuar com
              a assinatura.
            </p>
          </div>
        </CardHeader>
        <CardContent className='space-y-5 p-8'>
          <OtpCodeInput
            value={props.code}
            disabled={isPending}
            invalid={Boolean(props.error)}
            onChange={handleCodeChange}
          />
          <div
            aria-live='polite'
            className={`flex items-start gap-3 rounded-xl border p-4 ${
              isExpired
                ? 'border-badge-attention-border bg-badge-attention text-badge-attention-foreground'
                : 'border-border bg-muted/40'
            }`}
            id='otp-help'
            role='status'
          >
            <Timer aria-hidden='true' className='mt-0.5 size-4 shrink-0 text-primary' />
            <div className='space-y-1'>
              <p className='font-medium'>
                {isExpired ? 'Código expirado' : `Expira em ${remainingTimeLabel}`}
              </p>
              <p className='text-xs text-secondary-foreground'>
                {isExpired
                  ? 'Solicite um novo código para continuar.'
                  : 'O código pode ser usado apenas uma vez.'}
              </p>
            </div>
          </div>
          {props.error && (
            <p
              className='rounded-xl border border-badge-destructive-border bg-badge-destructive p-4 text-sm text-badge-destructive-foreground'
              role='alert'
            >
              Código inválido ou indisponível.
            </p>
          )}
          <div className='space-y-3'>
            <Button className='w-full' disabled={!canVerify} onClick={handleVerify}>
              <Check aria-hidden='true' />
              Confirmar código
            </Button>
            <div className='flex items-center justify-between gap-4'>
              <p className='text-xs text-muted-foreground'>
                {canResend ? 'Reenviar código agora' : `Reenviar em ${resendTimeLabel}`}
              </p>
              <Button
                className='h-auto px-0 text-xs'
                variant='link'
                disabled={!canResend}
                onClick={handleResend}
              >
                Reenviar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
