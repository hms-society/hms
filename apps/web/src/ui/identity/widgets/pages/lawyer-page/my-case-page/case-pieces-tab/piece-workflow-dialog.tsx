import { useState } from 'react'
import type { ReactNode } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { Label } from '@/ui/shadcn/label'
import { Textarea } from '@/ui/shadcn/textarea'

type PieceWorkflowDialogProps = {
  mode: 'editor' | 'review'
  open: boolean
  documentTitle?: string
  caseId?: string
  versionNumber?: number
  documentPreview?: ReactNode
  onOpenChange: (open: boolean) => void
  onRequestAdjustments: () => void
  onBlock: () => void
}

const documentReferences = [
  'CNIS · Filiação 12/03/1989 · 34a 2m',
  'CTPS · 6 vínculos registrados',
  'Certidão Tempo Contribuição · Emitida 28/06/2026',
]

export function PieceWorkflowDialog({
  mode,
  open,
  documentTitle,
  caseId,
  versionNumber,
  documentPreview,
  onOpenChange,
  onRequestAdjustments,
  onBlock,
}: PieceWorkflowDialogProps) {
  const [confirmed, setConfirmed] = useState(false)
  const isReview = mode === 'review'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[95vh] overflow-hidden p-0 sm:max-w-[1100px]'>
        <DialogTitle className='sr-only'>
          {isReview ? 'Revisão técnica da peça' : 'Editor de peça'}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          Fluxo de elaboração e revisão da peça do caso.
        </DialogDescription>
        <header className='flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3'>
          <div>
            <p className='text-xs text-muted-foreground'>
              {caseId ? `Caso ${caseId}` : 'Peças'} ·{' '}
              {isReview ? 'Revisão técnica' : 'Editor'}
            </p>
            <h2 className='font-serif text-lg font-semibold'>
              {documentTitle ?? 'Editor de peça'}
            </h2>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant={isReview ? 'info' : 'attention'}>
              {isReview ? 'Em revisão técnica' : `Em elaboração · v${versionNumber ?? 1}`}
            </Badge>
            <Button variant='outline' size='sm'>
              <Icon name='refresh-cw' /> Versões
            </Button>
          </div>
        </header>
        <div className='grid min-h-[620px] grid-cols-[180px_1fr_300px]'>
          <aside className='border-r border-border p-3'>
            <h3 className='mb-3 font-serif font-semibold'>Versões</h3>
            {[
              'v4 · Reenvio para revisão',
              'v3 · Aceite de bloco IA',
              'v2 · Aplicação de modelo',
            ].map((version, index) => (
              <button
                key={version}
                type='button'
                className='mb-2 w-full rounded-md border border-border p-2 text-left text-xs hover:bg-muted'
              >
                <span className='font-semibold'>{version.split(' · ')[0]}</span>
                <br />
                {version.split(' · ')[1]}
                <br />
                <span className='text-muted-foreground'>
                  {index === 0 ? 'hoje, 11:35' : 'ontem, 17:40'}
                </span>
              </button>
            ))}
          </aside>
          <main className='overflow-y-auto bg-muted/50 p-6'>
            {documentPreview ?? (
              <div className='flex min-h-[570px] items-center justify-center rounded-md bg-card p-8 text-sm text-muted-foreground'>
                Selecione uma peça para visualizar o documento.
              </div>
            )}
          </main>
          <aside className='flex flex-col border-l border-border p-4'>
            {isReview ? (
              <>
                <h3 className='font-serif font-semibold'>
                  Alertas de IA{' '}
                  <Badge className='float-right' variant='attention'>
                    3 apontamentos
                  </Badge>
                </h3>
                <div className='mt-3 space-y-2'>
                  {[
                    'Tempo de contribuição divergente',
                    'Pedido subsidiário ausente',
                    'Número do benefício anterior',
                  ].map((item, index) => (
                    <div
                      key={item}
                      className='rounded-md border border-border bg-muted/40 p-3 text-xs'
                    >
                      <p className='font-semibold'>
                        {index + 1}. {item}
                      </p>
                      <p className='mt-1 text-muted-foreground'>
                        A peça pode exigir conferência antes da aprovação.
                      </p>
                      <button type='button' className='mt-2 text-primary'>
                        ↳ Ir para o trecho
                      </button>
                    </div>
                  ))}
                </div>
                <div className='mt-5 border-t border-border pt-4'>
                  <h3 className='font-serif font-semibold'>Revisões dos membros</h3>
                  <p className='mt-2 rounded-md border border-border p-3 text-xs'>
                    Dr. Ricardo Mendes · Ajustes solicitados
                    <br />
                    <span className='text-muted-foreground'>
                      Corrigir a contagem do tempo de contribuição e incluir o
                      comprovante.
                    </span>
                  </p>
                </div>
                <div className='mt-auto space-y-2 border-t border-border pt-4'>
                  <div className='flex items-start gap-2 rounded-md border border-primary/50 bg-primary/10 p-3 text-xs'>
                    <Checkbox
                      checked={confirmed}
                      onCheckedChange={(value) => setConfirmed(value === true)}
                    />
                    Confirmo minha responsabilidade técnica sobre o conteúdo desta peça e
                    sua aptidão para protocolo ou entrega.
                  </div>
                  <Button className='w-full' disabled={!confirmed}>
                    ✓ Aprovar peça
                  </Button>
                  <div className='grid grid-cols-2 gap-2'>
                    <Button variant='outline' onClick={onRequestAdjustments}>
                      Solicitar ajustes
                    </Button>
                    <Button variant='destructive' onClick={onBlock}>
                      Bloquear
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className='font-serif font-semibold'>Documentos do dossiê</h3>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Clique para inserir a referência no texto.
                </p>
                <div className='mt-3 space-y-2'>
                  {documentReferences.map((item) => (
                    <button
                      key={item}
                      type='button'
                      className='flex w-full items-center gap-2 rounded-md border border-border p-2 text-left text-xs'
                    >
                      <Icon name='file-text' className='size-4 text-primary' />
                      {item}
                    </button>
                  ))}
                </div>
                <Textarea className='mt-auto' placeholder='Notas da elaboração...' />
                <Button className='mt-2 w-full'>Submeter para revisão</Button>
              </>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type ReviewActionDialogProps = {
  kind: 'adjustments' | 'block' | 'approval'
  open: boolean
  onOpenChange: (open: boolean) => void
  documentTitle?: string
  casePublicCode?: string
  versionNumber?: number
  onConfirm?: () => void
}

export function ReviewActionDialog({
  kind,
  open,
  onOpenChange,
  documentTitle = 'Peça jurídica',
  casePublicCode,
  versionNumber,
  onConfirm,
}: ReviewActionDialogProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [adjustmentComment, setAdjustmentComment] = useState('')
  const isBlock = kind === 'block'
  const isApproval = kind === 'approval'
  const title = isBlock
    ? 'Bloquear por falta documental?'
    : isApproval
      ? 'Confirmar aprovação da peça'
      : 'Solicitar ajustes na peça'
  const iconName = isBlock
    ? 'octagon-alert'
    : isApproval
      ? 'badge-check'
      : 'message-square-text'
  const description = isBlock
    ? 'Confirme o bloqueio somente quando o dossiê não permitir a aprovação técnica.'
    : isApproval
      ? 'Esta ação altera o status da peça para Aprovada e a libera para protocolo.'
      : 'Descreva de forma objetiva o que deve ser corrigido antes de devolver a peça.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className='gap-0 p-6 sm:max-w-[480px]'>
        <header className='flex items-start gap-3 pr-8'>
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isBlock ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}
          >
            <Icon name={iconName} className='size-5' />
          </span>
          <div className='min-w-0 flex-1'>
            <DialogTitle className='font-serif text-xl leading-6 font-semibold'>
              {title}
            </DialogTitle>
            <DialogDescription className='mt-1 text-sm leading-5'>
              {description}
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              variant='ghost'
              size='icon-sm'
              className='absolute top-4 right-4'
              aria-label='Fechar diálogo'
            >
              <Icon name='x' />
            </Button>
          </DialogClose>
        </header>

        {isBlock ? (
          <div className='mt-5 space-y-3'>
            <section className='rounded-lg bg-muted p-3'>
              <p className='text-xs font-semibold tracking-wide text-muted-foreground'>
                PEÇA AFETADA
              </p>
              <p className='mt-1 text-sm font-semibold'>
                {documentTitle} · Versão v{versionNumber ?? 1}
              </p>
            </section>
            <section className='rounded-lg border border-destructive/30 bg-destructive/5 p-3'>
              <h3 className='flex items-center gap-2 text-sm font-semibold text-destructive'>
                <Icon name='triangle-alert' className='size-4 shrink-0' />
                Esta ação terá os seguintes efeitos
              </h3>
              <ul className='mt-2 space-y-1.5 text-xs text-destructive'>
                <li>• Peça → Bloqueada por dossiê incompleto</li>
                <li>• Caso → retorna à fase de checklist documental</li>
                <li>• Decisão → registrada no Log de Auditoria</li>
              </ul>
            </section>
            <p className='flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground'>
              <Icon name='shield-check' className='mt-0.5 size-4 shrink-0 text-primary' />
              A IA não pode bloquear a peça nem alterar seu status sem esta confirmação
              humana.
            </p>
          </div>
        ) : isApproval ? (
          <div className='mt-5 space-y-3'>
            <section className='rounded-lg bg-secondary p-3'>
              <p className='text-xs font-semibold tracking-wide text-muted-foreground'>
                PEÇA EM REVISÃO
              </p>
              <p className='mt-1 text-sm font-semibold'>{documentTitle}</p>
              <p className='mt-1 text-xs text-primary'>
                {casePublicCode ? `${casePublicCode} · ` : ''}Versão v{versionNumber ?? 1}
              </p>
            </section>
            <div className='flex items-start gap-2 rounded-lg border border-primary p-3 text-xs'>
              <Checkbox
                id='piece-approval-responsibility'
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
              />
              <Label htmlFor='piece-approval-responsibility' className='cursor-pointer'>
                <strong className='block'>Confirmação obrigatória</strong>
                Confirmo minha responsabilidade técnica pela aprovação desta peça.
              </Label>
            </div>
            <p className='flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground'>
              <Icon name='shield-check' className='mt-0.5 size-4 shrink-0 text-primary' />
              O clique humano será registrado no Log de Auditoria. A IA não pode executar
              esta ação.
            </p>
          </div>
        ) : (
          <div className='mt-5 space-y-3'>
            <p className='flex items-start gap-2 rounded-lg bg-secondary p-3 text-xs text-secondary-foreground'>
              <Icon name='arrow-left' className='mt-0.5 size-4 shrink-0 text-primary' />A
              peça retornará para Dra. Mariana Lopes com status Ajustes solicitados.
            </p>
            <div className='space-y-1.5'>
              <Label htmlFor='piece-adjustment-comment' className='text-sm font-semibold'>
                Comentários para ajuste <span className='text-destructive'>*</span>
              </Label>
              <Textarea
                id='piece-adjustment-comment'
                aria-label='Comentários para ajuste'
                placeholder='Ex.: Relacionar o laudo ortopédico ao pedido principal e confirmar o NIT da parte autora...'
                className='min-h-32 resize-y'
                maxLength={1000}
                value={adjustmentComment}
                onChange={(event) => setAdjustmentComment(event.target.value)}
                required
              />
              <div className='flex justify-between gap-3 text-xs text-muted-foreground'>
                <span>Campo obrigatório para devolver a peça.</span>
                <span aria-live='polite'>{adjustmentComment.length}/1000</span>
              </div>
            </div>
          </div>
        )}

        <footer className='mt-5 flex justify-end gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='rounded-full px-4'
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant={isBlock ? 'destructive' : 'default'}
            size='sm'
            className={`rounded-full px-4 ${isBlock ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}`}
            disabled={
              (isApproval && !confirmed) ||
              (!isApproval && !isBlock && adjustmentComment.trim().length === 0)
            }
            onClick={() => {
              onConfirm?.()
              onOpenChange(false)
            }}
          >
            {isBlock ? <Icon name='octagon-alert' /> : null}
            {isApproval ? <Icon name='check' /> : null}
            {!isBlock && !isApproval ? <Icon name='send' /> : null}
            {isBlock
              ? 'Confirmar bloqueio'
              : isApproval
                ? 'Aprovar peça'
                : 'Enviar solicitação'}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
