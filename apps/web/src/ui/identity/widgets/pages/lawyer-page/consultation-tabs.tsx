import { ClipboardList, FileText, Package, Lock } from 'lucide-react'

interface ConsultationTabsProps {
  activeTab: 'details' | 'form' | 'package'
  onTabChange: (tab: 'details' | 'form' | 'package') => void
}

export function ConsultationTabs({ activeTab, onTabChange }: ConsultationTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-slate-200 text-sm font-medium text-slate-500">
      <button
        onClick={() => onTabChange('details')}
        className={`pb-2.5 transition-all flex items-center gap-2 ${
          activeTab === 'details'
            ? 'text-teal-800 border-b-2 border-teal-800 font-semibold'
            : 'hover:text-slate-800'
        }`}
      >
        <ClipboardList className="w-4 h-4" />
        <span>Detalhes</span>
      </button>

      <button
        onClick={() => onTabChange('form')}
        className={`pb-2.5 transition-all flex items-center gap-2 ${
          activeTab === 'form'
            ? 'text-teal-800 border-b-2 border-teal-800 font-semibold'
            : 'hover:text-slate-800'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>Ficha de Atendimento</span>
      </button>

      <button
        disabled
        className="pb-2.5 text-slate-400 cursor-not-allowed flex items-center gap-1.5 opacity-70"
      >
        <Package className="w-4 h-4" />
        <span>Pacote de documentos da consulta</span>
        <Lock className="w-3 h-3 ml-0.5" />
      </button>
    </div>
  )
}