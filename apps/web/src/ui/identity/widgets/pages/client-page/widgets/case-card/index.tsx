import { Card } from "@/ui/shadcn/card"
import { Badge } from "@/ui/shadcn/badge"
import { Icon } from "@/ui/shared/widgets/components/icon"
import { IntakeStatus } from "@hms/core/intake/domain/structures"
import type { Intake } from "@hms/core/intake/domain/entities"

export type CaseCardProps = {
  intake: Intake
}

export const CaseCard = ({ intake }: CaseCardProps) => {
  const getActionType = (areaId: string) => {
    const id = areaId.toLowerCase()
    if (id.includes('civel') || id.includes('civ')) return 'Ação Ordinária'
    if (id.includes('trabalho') || id.includes('tra')) return 'Reclamação Trabalhista'
    if (id.includes('familia') || id.includes('fam')) return 'Ação de Divórcio'
    return 'Petição Inicial / Cível'
  }

  const getStatusBadge = (status: IntakeStatus) => {
    switch (status) {
      case IntakeStatus.Registered:
        return <Badge variant="atention">Em análise de documentos</Badge>
      case IntakeStatus.ConsultationScheduled:
        return (
          <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-none">
            Consulta Agendada
          </Badge>
        )
      case IntakeStatus.ConsultationCompleted:
        return <Badge variant="wating">Consulta Realizada</Badge>
      case IntakeStatus.ViabilityRegistered:
        return (
          <Badge variant="atention">Em análise de viabilidade</Badge>
        )
      case IntakeStatus.InFormalization:
        return <Badge variant="default">Em formalização</Badge>
      case IntakeStatus.Contracted:
        return (
          <Badge variant="success" className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-none">
            Contratado
          </Badge>
        )
      case IntakeStatus.ClosedWithoutContract:
        return <Badge variant="outline">Encerrado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const hasPendency =
    intake.status === IntakeStatus.Registered ||
    intake.status === IntakeStatus.ViabilityRegistered

  return (
    <Card className="group flex flex-col justify-between p-6 h-56 border border-border/50 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 relative overflow-hidden cursor-pointer">
      {/* Top Header */}
      <div className="flex justify-between items-start w-full">
        <span className="font-extralight text-sm tracking-wider text-muted-foreground">
          Caso #{intake.sequenceNumber}
        </span>
        {hasPendency ? (
          <Badge variant="destructive" className="bg-destructive/10 text-destructive dark:bg-destructive/20 border-none">
            Envio de Docs Pendente
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
            Sem Pendências
          </Badge>
        )}
      </div>

      {/* Middle Info */}
      <div className="flex flex-col gap-1 my-3">
        <h3 className="font- text-2xl font-medium text-foreground group-hover:text-primary transition-colors duration-200">
          {getActionType(intake.legalAreaId)}
        </h3>
      </div>

      {/* Bottom Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-border w-full mt-auto">
        {getStatusBadge(intake.status)}
        <div className="p-1 rounded-full group-hover:bg-primary/10 transition-colors duration-300">
          <Icon
            name='chevron-down'
            className="size-4 text-muted-foreground group-hover:text-primary transition-all duration-300"
          />
        </div>
      </div>
    </Card>
  )
}
