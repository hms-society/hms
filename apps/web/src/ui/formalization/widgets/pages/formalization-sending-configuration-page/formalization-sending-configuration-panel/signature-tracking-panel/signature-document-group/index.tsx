import { Badge } from '@/ui/shadcn/badge'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { FormalizationSignatureDocumentContentKind } from '@hms/core/formalization/domain/structures'

import {
  useSignatureDocumentGroup,
  type SignatureDocumentGroupProps,
} from './use-signature-document-group'
import { SignatureSignatoryRow } from './signature-signatory-row'

export type { SignatureDocumentGroupProps } from './use-signature-document-group'

export const SignatureDocumentGroup = (props: SignatureDocumentGroupProps) => {
  const {
    canOpenDocuments,
    documentContentError,
    handleOpenDocument,
    openingDocumentKind,
    signatories,
  } = useSignatureDocumentGroup(props)
  const isDocumentComplete =
    props.document.status === 'submitted' || props.document.status === 'confirmed'
  const allSignatoriesSigned =
    signatories.length > 0 &&
    signatories.every(
      (signatory) => signatory.status === 'submitted' || signatory.status === 'confirmed',
    )

  return (
    <Card className='border-border shadow-none'>
      <CardHeader className='flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-start gap-3'>
          <Icon name='file-text' className='mt-1 size-5 shrink-0 text-primary' />
          <div className='min-w-0'>
            <h3 className='truncate font-serif text-lg font-semibold'>
              {props.document.title}
            </h3>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge
            variant={
              isDocumentComplete || props.document.signedArtifactAvailable
                ? 'success'
                : 'attention'
            }
          >
            {isDocumentComplete
              ? 'Assinado'
              : props.document.signedArtifactAvailable
                ? 'PDF assinado disponível'
                : allSignatoriesSigned
                  ? 'Processando documento'
                  : 'Aguardando assinatura'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='px-4 pb-4'>
        {canOpenDocuments && (
          <div className='mb-5 flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm font-medium'>Documentos concluídos</p>
              <p className='text-xs text-muted-foreground'>
                Consulte o PDF original preservado e a versão assinada.
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={openingDocumentKind !== null}
                onClick={() =>
                  void handleOpenDocument(
                    FormalizationSignatureDocumentContentKind.original,
                  )
                }
              >
                <Icon name='external-link' className='size-4' />
                {openingDocumentKind ===
                FormalizationSignatureDocumentContentKind.original
                  ? 'Abrindo…'
                  : 'Ver original'}
              </Button>
              <Button
                type='button'
                variant='outline'
                disabled={openingDocumentKind !== null}
                onClick={() =>
                  void handleOpenDocument(
                    FormalizationSignatureDocumentContentKind.signed,
                  )
                }
              >
                <Icon name='external-link' className='size-4' />
                {openingDocumentKind === FormalizationSignatureDocumentContentKind.signed
                  ? 'Abrindo…'
                  : 'Ver assinado'}
              </Button>
            </div>
          </div>
        )}
        {documentContentError && (
          <p className='mb-4 text-sm text-destructive' role='alert'>
            {documentContentError}
          </p>
        )}
        <h4 className='text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground'>
          Signatários
        </h4>
        {signatories.length === 0 ? (
          <p className='mt-3 text-sm text-muted-foreground'>
            Nenhum signatário associado.
          </p>
        ) : (
          <ul className='mt-1' aria-label={`Signatários de ${props.document.title}`}>
            {signatories.map((signatory) => (
              <SignatureSignatoryRow
                key={signatory.recipientId}
                signatory={signatory}
                isResending={props.isResending}
                onRequestResend={props.onRequestResend}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
