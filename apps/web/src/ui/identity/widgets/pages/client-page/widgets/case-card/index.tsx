import { Card } from '@/ui/shadcn/card'
import { Badge } from '@/ui/shadcn/badge'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { IntakeStatus } from '@hms/core/intake/domain/structures'
import type { Intake } from '@hms/core/intake/domain/entities'
import { getStatusBadge, getActionType } from '../../utils/case-helpers'

export type CaseCardProps = {
  intake: Intake
}

export const CaseCard = ({ intake }: CaseCardProps) => {
  const { navigateTo } = useNavigation()

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigateTo('clientMyCaseDetails', { params: { caseId: intake.id } })
  }

  const hasPendency =
    intake.status === IntakeStatus.Registered ||
    intake.status === IntakeStatus.ViabilityRegistered

  return (
    <Card className='group flex flex-col justify-between p-6 h-56 border border-border/50 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 relative overflow-hidden cursor-pointer'>
      {/* Top Header */}
      <div className='flex justify-between items-start w-full'>
        <span className='font-extralight text-sm tracking-wider text-muted-foreground'>
          Caso #{intake.sequenceNumber}
        </span>
        {hasPendency ? (
          <Badge
            variant='destructive'
            className='bg-destructive/10 text-destructive dark:bg-destructive/20 border-none'
          >
            Envio de Docs Pendente
          </Badge>
        ) : (
          <Badge variant='secondary' className='bg-primary/5 text-primary border-none'>
            Sem Pendências
          </Badge>
        )}
      </div>

      {/* Middle Info */}
      <div className='flex flex-col gap-1 my-3'>
        <h3 className='font- text-2xl font-medium text-foreground group-hover:text-primary transition-colors duration-200'>
          {getActionType(intake.legalAreaId)}
        </h3>
        <span className='font-light text-sm tracking-wider text-muted-foreground'>
          Notas:
          {intake.demandNotes}
        </span>
      </div>

      {/* Bottom Footer */}
      <div className='flex justify-between items-center pt-4 border-t border-border w-full mt-auto'>
        {getStatusBadge(intake.status)}
        <button
          type='button'
          onClick={handleNavigate}
          className='p-1 rounded-full group-hover:bg-primary/10 transition-colors duration-300 cursor-pointer border-none bg-transparent outline-none'
        >
          <Icon
            name='chevron-down'
            className='size-4 text-muted-foreground group-hover:text-primary transition-all duration-300'
          />
        </button>
      </div>
    </Card>
  )
}
