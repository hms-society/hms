import { useState } from 'react'
import { Scale, ChevronUp, Sparkles, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'
import { AddClaimDialog } from '../add-claim'

export interface LegalClaim {
  id: string
  title: string
  summary: string
  isSuggested?: boolean
}

interface ClaimsSectionProps {
  claims: LegalClaim[]
  onAddClaim?: (claim: { id?: string; title: string; summary: string }) => void
  onRemoveClaim?: (id: string) => void
}

export function ClaimsSection({
  claims,
  onAddClaim,
  onRemoveClaim,
}: ClaimsSectionProps) {
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
          <Scale className="w-4 h-4 text-teal-800" /> Possíveis pedidos jurídicos
        </h2>
        <ChevronUp className="w-4 h-4 text-slate-400 cursor-pointer" />
      </div>

      {claims.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">Nenhum pedido registrado ainda.</p>
      ) : (
        <div className="space-y-2">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0 space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800 whitespace-pre-wrap break-words leading-snug">
                    {claim.title}
                  </span>
                  {claim.isSuggested && (
                    <Badge className="bg-purple-100 text-purple-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3" /> Sugerido
                    </Badge>
                  )}
                </div>
                {claim.summary && (
                  <p className="text-xs text-slate-500 whitespace-pre-wrap break-words leading-relaxed">
                    {claim.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(claim)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title="Editar pedido"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveClaim?.(claim.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Excluir pedido"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={handleOpenAdd}
        className="text-xs font-semibold text-teal-800 p-0 h-auto gap-1.5 cursor-pointer hover:bg-transparent"
      >
        <Plus className="w-4 h-4" /> Adicionar pedido manualmente
      </Button>

      <AddClaimDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        claimToEdit={editingClaim}
        onAdd={(claim) => onAddClaim?.(claim)}
      />
    </div>
  )
}