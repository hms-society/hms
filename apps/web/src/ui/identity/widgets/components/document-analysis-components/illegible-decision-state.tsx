import { Icon } from '@/ui/shared/widgets/components/icon'

export const IllegibleDecisionState = () => {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="font-sans text-xs text-muted-foreground">
        A IA não encontrou legibilidade suficiente. Você pode alterar o resultado antes de salvar.
      </p>

      <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-4 border border-border/50">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon name="link" className="size-4 opacity-50" />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-sm font-semibold text-foreground">
            Vínculo indisponível
          </span>
          <span className="mt-0.5 font-sans text-xs text-muted-foreground">
            Um documento ilegível não pode ser vinculado a caso ou item do checklist.
          </span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-[#FAF8F5] p-4 border border-border">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-muted-foreground shadow-sm">
          <Icon name="file-text" className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-sm font-semibold text-foreground">
            Extração indisponível
          </span>
          <span className="mt-0.5 font-sans text-xs text-muted-foreground">
            Os campos extraídos são exibidos somente para resultados Válido ou Incompleto.
          </span>
        </div>
      </div>
    </div>
  )
}