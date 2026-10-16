import type { DocumentException } from '../types'

export type ExceptionCardDetailsProps = {
  exception: DocumentException
  title: string
}

export const ExceptionCardDetails = ({ exception, title }: ExceptionCardDetailsProps) => (
  <div className='flex flex-col'>
    <span className='font-semibold text-foreground'>{title}</span>
    <span className='text-xs text-muted-foreground'>
      {exception.type === 'ACEITE_PROVISORIO'
        ? 'Aceite provisório'
        : 'Dispensa definitiva'}
    </span>
  </div>
)
