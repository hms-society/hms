import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Tabs, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { SigningDocumentViewer } from './signing-document-viewer'
import {
  useDocumentReadingStep,
  type DocumentReadingStepProps,
} from './use-document-reading-step'

export type { DocumentReadingStepProps } from './use-document-reading-step'

export const DocumentReadingStep = (props: DocumentReadingStepProps) => {
  const state = useDocumentReadingStep(props)
  const document = state.activeDocument

  return (
    <main className='flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6'>
      <Card className='w-full max-w-6xl border-border shadow-sm'>
        <CardHeader className='gap-2'>
          <h1 className='font-serif text-3xl'>Documentos para assinatura</h1>
          <p className='font-sans text-sm text-muted-foreground'>
            Leia e confirme cada documento antes de continuar para a assinatura.
          </p>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 font-sans text-sm'>
          <Tabs value={document?.id} onValueChange={props.onSelectDocument}>
            <TabsList className='h-auto w-full justify-start overflow-x-auto'>
              {props.documents.map((item) => (
                <TabsTrigger key={item.id} value={item.id} className='gap-2'>
                  {item.title}
                  <span className='sr-only'>
                    {props.acknowledgedDocumentIds.includes(item.id)
                      ? 'Documento confirmado'
                      : 'Documento pendente'}
                  </span>
                  <span aria-hidden='true'>
                    {props.acknowledgedDocumentIds.includes(item.id) ? '✓' : '•'}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {document ? (
            <SigningDocumentViewer
              documentId={document.id}
              title={document.title}
              pageCount={document.pageCount}
              content={state.content}
              isLoading={state.isLoading}
              error={state.documentError}
              onRetry={() => void state.handleRetry()}
            />
          ) : null}

          {state.actionError ? (
            <p role='alert' className='text-destructive'>
              {state.actionError}
            </p>
          ) : null}

          <div className='flex flex-col gap-3 sm:flex-row sm:justify-end'>
            <Button
              variant='outline'
              disabled={
                !document ||
                state.acknowledged ||
                state.isLoading ||
                Boolean(state.documentError) ||
                props.isPending
              }
              onClick={state.handleAcknowledge}
            >
              {state.acknowledged ? 'Documento confirmado' : 'Li este documento'}
            </Button>
            <Button
              disabled={!state.allAcknowledged || props.isPending}
              onClick={state.handleContinue}
            >
              Assinar todos os documentos
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
