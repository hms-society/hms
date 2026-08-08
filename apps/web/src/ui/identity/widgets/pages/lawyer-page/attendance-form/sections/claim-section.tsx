import { Scale, ChevronUp, CheckCircle2, XCircle, Sparkles } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'
import { Badge } from '@/ui/shadcn/badge'

export interface LegalClaim {
  id: string
  title: string
  summary: string
  isSuggested?: boolean
}

interface ClaimsSectionProps {
  claims: LegalClaim[]
}

export function ClaimsSection({ claims }: ClaimsSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
          <Scale className="w-4 h-4 text-teal-800" /> Possíveis pedidos jurídicos
        </h2>
        <ChevronUp className="w-4 h-4 text-slate-400 cursor-pointer" />
      </div>

      <div className="space-y-2">
        {claims.map((claim) => (
          <div key={claim.id} className="p-3 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{claim.title}</span>
              <div className="flex items-center gap-1.5">
                {claim.isSuggested && (
                  <Badge className="bg-purple-100 text-purple-800 text-[10px] border-none font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Sugerido
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-700 cursor-pointer">
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 cursor-pointer">
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {claim.summary && <p className="text-[11px] text-slate-500">{claim.summary}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}