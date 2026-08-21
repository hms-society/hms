import { Button } from '@/ui/shadcn/button'
import { Card } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Stepper } from '@/ui/shared/widgets/components/stepper'
import { useBottomDetails } from './use-bottom-details'

export type BottomDetailsProps = Record<string, never>

export const BottomDetails = (_props: BottomDetailsProps) => {
  const {
    approvedDocuments,
    error,
    handleUploadError,
    isLoading,
    messages,
    pendingDocuments,
    timeline,
  } = useBottomDetails()

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 w-full animate-pulse'>
        <Card className='lg:col-span-2 p-8 h-96'>
          <Skeleton className='h-8 w-48 mb-6' />
          <Skeleton className='h-12 w-full mb-4' />
          <Skeleton className='h-12 w-full mb-4' />
          <Skeleton className='h-12 w-full' />
        </Card>
        <div className='flex flex-col gap-8'>
          <Card className='p-8 h-48'>
            <Skeleton className='h-8 w-36 mb-4' />
            <Skeleton className='h-16 w-full' />
          </Card>
          <Card className='p-8 h-48'>
            <Skeleton className='h-8 w-36 mb-4' />
            <Skeleton className='h-16 w-full' />
          </Card>
        </div>
      </div>
    )
  }

  if (error) throw new Error('Case details not found')

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 w-full'>
      <Card className='lg:col-span-2 p-8 bg-card border border-border/60 shadow-sm flex flex-col gap-6'>
        <div className='flex justify-between items-center'>
          <h2 className='text-2xl font-medium font-serif text-brand dark:text-primary'>
            Checklist de Documentação
          </h2>
        </div>

        <div className='flex flex-col gap-4'>
          <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
            Documentos Pendentes
          </h3>
          {pendingDocuments.length === 0 ? (
            <div className='text-sm text-muted-foreground p-4 bg-muted/20 border border-dashed rounded-lg'>
              Nenhum documento pendente.
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {pendingDocuments.map((document) => (
                <div
                  key={document.name}
                  className='flex justify-between items-center p-4 border-b-1 border-destructive/30'
                >
                  <div className='flex items-center gap-3 rounded-full'>
                    <Icon name='x' className='size-5 text-destructive/70' />
                    <span className='text-sm font-medium'>{document.name}</span>
                  </div>
                  <Button variant='destructive' size='sm' onClick={handleUploadError}>
                    Enviar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex flex-col gap-4 mt-4'>
          <h3 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground'>
            Documentos Aprovados
          </h3>
          {approvedDocuments.length === 0 ? (
            <div className='text-sm text-muted-foreground p-4 bg-muted/20 border border-dashed rounded-lg'>
              Nenhum documento aprovado ainda.
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              {approvedDocuments.map((document) => (
                <div
                  key={document.name}
                  className='flex justify-between items-center p-4 border-b-1 border-emerald-500/30'
                >
                  <div className='flex items-center gap-3'>
                    <Icon name='check' className='size-5 text-emerald-600' />
                    <span className='text-sm font-medium'>{document.name}</span>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    Aprovado em {document.updatedAt}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className='flex flex-col gap-8 lg:col-span-1'>
        <Card className='p-8 bg-card border border-border/60 shadow-sm flex flex-col gap-6'>
          <h2 className='text-xl font-medium font-serif text-brand dark:text-primary'>
            Andamento do Processo
          </h2>
          <Stepper
            orientation='vertical'
            activeStep={0}
            steps={timeline.map((event) => ({
              label: event.title,
              description: event.desc,
              date: event.date,
              time: event.time,
            }))}
          />
        </Card>

        <Card className='p-8 bg-card border border-border/60 shadow-sm flex flex-col gap-6'>
          <h2 className='text-xl font-medium font-serif text-brand dark:text-primary'>
            Mensagens do Escritório
          </h2>
          <div className='flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1'>
            {messages.map((message) => (
              <div
                key={`${message.sender}-${message.date}-${message.content}`}
                className='p-4 rounded-lg bg-muted/40 border border-border/40 flex flex-col gap-2'
              >
                <div className='flex justify-between items-start'>
                  <div className='flex flex-col'>
                    <span className='text-xs font-bold text-brand dark:text-primary'>
                      {message.sender}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      {message.role}
                    </span>
                  </div>
                  <span className='text-[10px] text-muted-foreground'>
                    {message.date}
                  </span>
                </div>
                <p className='text-xs text-foreground mt-1 leading-relaxed'>
                  {message.content}
                </p>
              </div>
            ))}
          </div>
          <Button variant='outline' size='sm' className='w-full gap-2'>
            <Icon name='message-square' className='size-4' />
            Enviar Mensagem
          </Button>
        </Card>
      </div>
    </div>
  )
}
