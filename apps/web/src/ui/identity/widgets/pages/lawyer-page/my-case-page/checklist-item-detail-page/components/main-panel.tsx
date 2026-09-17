import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/shadcn/dialog'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import type {
  ChecklistItemDetailView,
  ChecklistItemPending,
} from '../use-checklist-item-detail-page'

export type ChecklistItemMainPanelProps = {
  itemView: ChecklistItemDetailView
}

export const ChecklistItemMainPanel = ({ itemView }: ChecklistItemMainPanelProps) => {
  const hasPendingItems = itemView.pendingItems.length > 0

  return (
    <main className='flex flex-col gap-4'>
      <section
        className={
          hasPendingItems
            ? 'rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 shadow-xs'
            : 'rounded-lg border border-border bg-card p-4 shadow-xs'
        }
      >
        <div className='flex items-start gap-3'>
          <div
            className={
              hasPendingItems
                ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-amber-700'
                : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground'
            }
          >
            <Icon
              name={hasPendingItems ? 'alert-triangle' : 'check-circle-2'}
              className='size-4'
            />
          </div>
          <div className='flex flex-col gap-1'>
            <h2
              className={
                hasPendingItems
                  ? 'text-sm font-semibold text-amber-900'
                  : 'text-sm font-semibold text-foreground'
              }
            >
              {hasPendingItems ? 'Pendências do item' : 'Sem pendências ativas'}
            </h2>
            <p
              className={
                hasPendingItems
                  ? 'text-xs text-amber-900/80'
                  : 'text-xs text-muted-foreground'
              }
            >
              {hasPendingItems
                ? 'Revise os pontos abaixo antes de concluir a validação do item.'
                : 'Nenhuma pendência específica foi registrada para este item.'}
            </p>
          </div>
        </div>
      </section>

      <section className='flex flex-col gap-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-serif text-lg font-semibold text-foreground'>
            Pendências ativas
          </h2>
          <Badge
            variant={hasPendingItems ? 'destructive' : 'secondary'}
            className='h-5 rounded-full px-2 text-[10px]'
          >
            {itemView.pendingItems.length}
          </Badge>
        </div>

        {hasPendingItems ? (
          itemView.pendingItems.map((pendingItem, index) => (
            <PendingCard
              key={pendingItem.id}
              index={index + 1}
              pendingItem={pendingItem}
            />
          ))
        ) : (
          <div className='rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground shadow-xs'>
            Nenhuma pendência ativa vinculada ao item selecionado.
          </div>
        )}
      </section>
    </main>
  )
}

type PendingCardProps = {
  index: number
  pendingItem: ChecklistItemPending
}

const PendingCard = ({ index, pendingItem }: PendingCardProps) => (
  <PendingCardContent index={index} pendingItem={pendingItem} />
)

const PendingCardContent = ({ index, pendingItem }: PendingCardProps) => {
  const { caseManagementService } = useRestContext()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [subject, setSubject] = useState(pendingItem.subject)
  const [body, setBody] = useState(pendingItem.body)
  useEffect(() => {
    setSubject(pendingItem.subject)
    setBody(pendingItem.body)
  }, [pendingItem.body, pendingItem.subject])
  const editMutation = useMutation({
    mutationFn: async () => {
      const response = await caseManagementService.editPendingMessage(pendingItem.id, {
        subject,
        body,
      })
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      setIsEditOpen(false)
      await queryClient.invalidateQueries({
        queryKey: ['case-management', 'pendencies', pendingItem.id],
      })
      await queryClient.invalidateQueries({
        queryKey: ['case-management', 'pendencies', pendingItem.id.split('-')[0], 'messages'],
      })
    },
  })
  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await caseManagementService.approvePendingMessage(pendingItem.id)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['case-management'] })
    },
  })

  return (
    <>
      <article className='rounded-lg border border-border bg-card p-4 shadow-xs'>
    <div className='flex items-start gap-3'>
      <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-xs font-semibold text-destructive'>
        {index}
      </div>
      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <h3 className='text-sm font-semibold text-foreground'>{pendingItem.title}</h3>
          <Badge variant='destructive' className='h-5 rounded-full px-2 text-[10px]'>
            Ativa
          </Badge>
        </div>
        <p className='rounded-md bg-muted/60 p-3 text-xs text-muted-foreground'>
          {pendingItem.description}
        </p>
        {pendingItem.documentFileName && (
          <p className='text-xs text-muted-foreground'>
            Documento: <span className='font-medium'>{pendingItem.documentFileName}</span>
          </p>
        )}
        <div className='flex flex-col gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
              Mensagem assistida
            </span>
            <Badge variant='attention' className='h-5 rounded-full px-2 text-[10px]'>
              {pendingItem.status === 'awaiting_approval'
                ? 'Aguardando aprovação'
                : pendingItem.status}
            </Badge>
          </div>
          <p className='text-sm italic text-foreground'>{pendingItem.body}</p>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              size='xs'
              className='rounded-full'
              onClick={() => setIsEditOpen(true)}
              disabled={pendingItem.status !== 'awaiting_approval'}
            >
              <Icon name='pencil' className='size-3' />
              Editar
            </Button>
            <Button
              type='button'
              variant='brand'
              size='xs'
              className='rounded-full'
              onClick={() => approveMutation.mutate()}
              disabled={pendingItem.status !== 'awaiting_approval' || approveMutation.isPending}
            >
              <Icon name='send' className='size-3' />
              {approveMutation.isPending ? 'Aprovando...' : 'Aprovar e enviar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
      </article>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar mensagem assistida</DialogTitle>
            <DialogDescription>
              Revise a mensagem antes de aprovar e enviar ao cliente.
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-4'>
            <label className='flex flex-col gap-1 text-sm font-medium'>
              Assunto
              <input className='rounded-md border bg-background px-3 py-2' value={subject} onChange={(event) => setSubject(event.target.value)} />
            </label>
            <label className='flex flex-col gap-1 text-sm font-medium'>
              Mensagem
              <textarea className='min-h-32 rounded-md border bg-background px-3 py-2' value={body} onChange={(event) => setBody(event.target.value)} />
            </label>
          </div>
          <DialogFooter showCloseButton>
            <Button type='button' variant='brand' onClick={() => editMutation.mutate()} disabled={editMutation.isPending || !subject.trim() || !body.trim()}>
              {editMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
