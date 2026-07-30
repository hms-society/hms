import { Card } from "@/ui/shadcn/card"
import { Icon } from "@/ui/shared/widgets/components/icon"
import { Skeleton } from "@/ui/shadcn/skeleton"
import type { Intake } from "@hms/core/intake/domain/entities"
import { CaseCard } from "../case-card"

export type CaseSectionProps = {
  isLoading: boolean
  error: any
  clientIntakes: Intake[]
}

export const CaseSection = ({ isLoading, error, clientIntakes }: CaseSectionProps) => {
  return (
    <div className="flex flex-col gap-6 flex-1 w-full">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-6 h-56 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-32 rounded-full" />
              </div>
              <div className="flex flex-col gap-2 my-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-8 w-full mt-2" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-8 text-center border-destructive/20 bg-destructive/5 text-destructive rounded-lg flex-1 w-full flex items-center justify-center">
          Não foi possível carregar seus casos. Por favor, tente novamente mais tarde.
        </Card>
      ) : clientIntakes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-border/80 bg-muted/20 flex-1 w-full">
          <Icon name="briefcase" className="size-12 text-muted-foreground/60 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">Nenhum caso encontrado</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Você ainda não possui solicitações de atendimento cadastradas. Clique em "Novo Caso" para iniciar.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {clientIntakes.map((intake) => (
            <CaseCard key={intake.id} intake={intake} />
          ))}
        </div>
      )}
    </div>
  )
}
