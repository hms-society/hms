import { useState } from 'react'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'
import { CollapsibleCard } from '@/ui/shared/widgets/components/collapsible-card'
import { AddClaimDialog } from '../../add-claim'

export type LegalClaim = {
  id: string
  title: string
  summary: string
  isSuggested?: boolean
}

export type ClaimsSectionProps = {
  claims: LegalClaim[]
  onAddClaim?: (claim: { id?: string; title: string; summary: string }) => void
  onRemoveClaim?: (id: string) => void
  isReadOnly?: boolean
}

export const ClaimsSection = ({
  claims,
  onAddClaim,
  onRemoveClaim,
  isReadOnly = false,
}: ClaimsSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClaim, setEditingClaim] = useState<LegalClaim | null>(null)

  const handleOpenAdd = () => {
    setEditingClaim(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (claim: LegalClaim) => {
    setEditingClaim(claim)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClaim(null)
  }

  return (
    <CollapsibleCard
      isOptional
      title={
        <h2 className='text-base font-bold text-slate-800 flex items-center gap-2 font-serif'>
          <Icon name='scale' className='w-4 h-4 text-teal-800' /> Possíveis pedidos
          jurídicos
        </h2>
      }
    >
      {claims.length === 0 ? (
        <p className='text-xs text-slate-400 py-2'>Nenhum pedido registrado ainda.</p>
      ) : (
        <div className='space-y-2'>
          {claims.map((claim) => (
            <div
              key={claim.id}
              className='flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors'
            >
              <div className='min-w-0 space-y-1 flex-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-xs font-bold text-slate-800 whitespace-pre-wrap break-words leading-snug'>
                    {claim.title}
                  </span>
                  {claim.isSuggested && (
                    <Badge className='bg-purple-100 text-purple-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0'>
                      <Icon name='plus' className='w-3 h-3' /> Sugerido
                    </Badge>
                  )}
                </div>
                {claim.summary && (
                  <p className='text-xs text-slate-500 whitespace-pre-wrap break-words leading-relaxed'>
                    {claim.summary}
                  </p>
                )}
              </div>

              {!isReadOnly && (
                <div className='flex items-center gap-2 shrink-0 pt-0.5'>
                  <button
                    type='button'
                    onClick={() => handleOpenEdit(claim)}
                    className='text-slate-400 hover:text-slate-600 transition-colors cursor-pointer'
                    title='Editar pedido'
                  >
                    <Icon name='pencil' className='w-4 h-4' />
                  </button>

                  <button
                    type='button'
                    onClick={() => onRemoveClaim?.(claim.id)}
                    className='text-slate-400 hover:text-rose-600 transition-colors cursor-pointer'
                    title='Excluir pedido'
                  >
                    <Icon name='trash-2' className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isReadOnly && (
        <Button
          type='button'
          variant='ghost'
          onClick={handleOpenAdd}
          className='text-xs font-semibold text-teal-800 p-0 h-auto gap-1.5 cursor-pointer hover:bg-transparent'
        >
          <Icon name='plus' className='w-4 h-4' /> Adicionar pedido manualmente
        </Button>
      )}

      {!isReadOnly && (
        <AddClaimDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          claimToEdit={editingClaim}
          onAdd={(claim) => onAddClaim?.(claim)}
        />
      )}
    </CollapsibleCard>
  )
}
