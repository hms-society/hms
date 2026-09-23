import { useState } from 'react'

import { Icon } from '@/ui/shared/widgets/components/icon'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/ui/shadcn/dialog'
import { Textarea } from '@/ui/shadcn/textarea'

type PieceWorkflowDialogProps = {
  mode: 'editor' | 'review'
  open: boolean
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
              CASO-20260703-0089 · Peças · {isReview ? 'Revisão técnica' : 'Editor'}
            </p>
            <h2 className='font-serif text-lg font-semibold'>
              Requerimento Administrativo — Aposentadoria por Tempo de Contribuição
            </h2>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant={isReview ? 'info' : 'attention'}>
              {isReview ? 'Em revisão · v4' : 'Em elaboração · v3'}
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
            <div className='mx-auto min-h-[570px] max-w-[650px] bg-card p-10 shadow-sm'>
              <p className='text-center font-serif text-sm font-semibold'>
                AO INSTITUTO NACIONAL DO SEGURO SOCIAL — INSS
              </p>
              <p className='mt-2 text-center text-xs text-muted-foreground'>
                Agência da Previdência Social — São José dos Campos/SP
              </p>
              <p className='mt-10 text-sm leading-7'>
                ANTÔNIO CARVALHO DA SILVA, brasileiro, casado, industrial, portador do RG
                nº •••.••• e CPF nº •••.•••-45, residente e domiciliado à Rua Vitória
                Régia, nº 210, vem respeitosamente requerer:
              </p>
              <h3 className='mt-8 font-serif text-sm font-semibold'>I — DOS FATOS</h3>
              <p className='mt-3 text-sm leading-7'>
                O requerente é filiado ao Regime Geral de Previdência Social desde
                12/03/1989, tendo exercido atividade laboral ininterrupta pelos vínculos
                registrados em CTPS e confirmados pelo CNIS.
              </p>
              <h3 className='mt-8 font-serif text-sm font-semibold'>II — DO DIREITO</h3>
              <p className='mt-3 text-sm leading-7'>
                Nos termos da legislação aplicável, requer o reconhecimento dos requisitos
                legais e a concessão do benefício mais vantajoso.
              </p>
            </div>
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
}

export function ReviewActionDialog({
  kind,
  open,
  onOpenChange,
}: ReviewActionDialogProps) {
  const [confirmed, setConfirmed] = useState(false)
  const isBlock = kind === 'block'
  const isApproval = kind === 'approval'
  const title = isBlock
    ? 'Bloquear por falta documental?'
    : isApproval
      ? 'Confirmar aprovação da peça'
      : 'Solicitar ajustes na peça'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[520px]'>
        <DialogTitle className='font-serif text-xl'>{title}</DialogTitle>
        <DialogDescription>
          {isBlock
            ? 'Confirme o bloqueio somente quando o dossiê não permitir a aprovação técnica.'
            : isApproval
              ? 'Esta ação altera o status da peça para Aprovada e a libera para protocolo.'
              : 'Descreva de forma objetiva o que deve ser corrigido antes de devolver a peça.'}
        </DialogDescription>
        <div className='rounded-md bg-muted p-3 text-sm font-medium'>
          Requerimento Administrativo — Aposentadoria por Tempo de Contribuição · Versão
          v4
        </div>
        {isApproval ? (
          <div className='flex items-start gap-2 rounded-md border border-primary p-3 text-sm'>
            <Checkbox
              checked={confirmed}
              onCheckedChange={(value) => setConfirmed(value === true)}
            />
            Confirmo minha responsabilidade técnica pela aprovação desta peça.
          </div>
        ) : isBlock ? (
          <div className='rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive'>
            Esta ação marcará a peça como bloqueada por dossiê incompleto e retornará o
            caso para a etapa documental.
          </div>
        ) : (
          <Textarea
            placeholder='Ex.: Corrigir a contagem do tempo de contribuição e incluir o comprovante do último vínculo.'
            required
          />
        )}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant={isBlock ? 'destructive' : 'default'}
            disabled={isApproval && !confirmed}
            onClick={() => onOpenChange(false)}
          >
            {isBlock
              ? 'Confirmar bloqueio'
              : isApproval
                ? 'Aprovar peça'
                : 'Enviar solicitação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
