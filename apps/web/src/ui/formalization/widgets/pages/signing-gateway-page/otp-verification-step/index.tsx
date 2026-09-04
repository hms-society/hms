import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { OtpCodeInput } from './otp-code-input'
import { useOtpVerificationStep } from './use-otp-verification-step'

export type { OtpVerificationStepProps } from './use-otp-verification-step'
import type { OtpVerificationStepProps } from './use-otp-verification-step'

export const OtpVerificationStep = (props: OtpVerificationStepProps) => {
  const { handleCodeChange, handleResend, handleVerify, isPending } =
    useOtpVerificationStep(props)
  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-lg border border-border shadow-sm'>
        <CardHeader>
          <h1 className='font-serif text-3xl'>Digite o código</h1>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <p>Enviamos um código de seis dígitos para seu e-mail.</p>
          <OtpCodeInput
            value={props.code}
            disabled={isPending}
            invalid={Boolean(props.error)}
            onChange={handleCodeChange}
          />
          <p id='otp-help'>Expira em {new Date(props.expiresAt).toLocaleTimeString()}</p>
          {props.error && <p role='alert'>Código inválido ou indisponível.</p>}
          <div className='flex gap-2'>
            <Button
              disabled={isPending || props.code.length !== 6}
              onClick={handleVerify}
            >
              Confirmar
            </Button>
            <Button
              variant='outline'
              disabled={
                isPending || Date.now() < new Date(props.resendAvailableAt).getTime()
              }
              onClick={handleResend}
            >
              Reenviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
