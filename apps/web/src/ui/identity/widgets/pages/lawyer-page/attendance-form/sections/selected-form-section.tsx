import { FileText } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'

interface SelectedFormSectionProps {
  selectedFormName: string
  legalArea: string
  legalTheme: string
  onOpenSelectModal: () => void
}

export function SelectedFormSection({
  selectedFormName,
  legalArea,
  legalTheme,
  onOpenSelectModal,
}: SelectedFormSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 font-serif">
          <FileText className="w-4 h-4 text-teal-800" /> Ficha de atendimento
        </h2>
        <Button
          variant="outline"
          onClick={onOpenSelectModal}
          className="rounded-full text-xs h-8 px-4 border-slate-200 text-teal-800 hover:bg-teal-50 cursor-pointer"
        >
          Trocar ficha
        </Button>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-800">{selectedFormName}</p>
          <p className="text-[11px] text-slate-500">
            {legalArea} · {legalTheme}
          </p>
        </div>
      </div>
    </div>
  )
}