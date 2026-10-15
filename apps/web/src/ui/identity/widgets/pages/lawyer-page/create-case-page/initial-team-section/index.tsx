import type { UseFieldArrayUpdate } from 'react-hook-form'
import type {
  CaseEligibleCollaborator,
  CaseOpeningSource,
  CaseMemberRole,
} from '@hms/core/case-management/domain/structures'
import type { CreateCaseData } from '@hms/validation/case-management'
import { InitialManagerCard } from '../initial-manager-card'
import { TeamRoster } from '../team-roster'

type TeamField = { id: string; collaboratorId: string; role: CaseMemberRole }

export type InitialTeamSectionProps = {
  manager: CaseEligibleCollaborator | null
  openingSource?: CaseOpeningSource
  isLoadingSuggestion: boolean
  suggestionError: unknown
  managerError?: string
  fields: readonly TeamField[]
  members: readonly CaseEligibleCollaborator[]
  update: UseFieldArrayUpdate<CreateCaseData, 'team'>
  onSelectManager: () => void
  onAddTeamMember: () => void
  onRemoveTeamMember: (index: number) => void
}

export const InitialTeamSection = (props: InitialTeamSectionProps) => (
  <section className='rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6'>
    <h2 className='text-lg font-semibold text-foreground'>Equipe inicial</h2>
    <p className='mb-5 mt-1 text-sm text-muted-foreground'>
      Escolha um advogado ativo para ser o gestor inicial. Você pode incluir outros
      colaboradores agora ou depois.
    </p>
    <div className='space-y-4'>
      <InitialManagerCard
        manager={props.manager}
        openingSource={props.openingSource}
        isLoadingSuggestion={props.isLoadingSuggestion}
        suggestionError={props.suggestionError}
        selectionError={props.managerError}
        onSelectManager={props.onSelectManager}
      />
      <TeamRoster
        fields={props.fields}
        members={props.members}
        onAdd={props.onAddTeamMember}
        onRemove={props.onRemoveTeamMember}
        onUpdate={props.update}
      />
    </div>
  </section>
)
