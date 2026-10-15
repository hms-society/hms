import { CaseMemberRole } from '@hms/core/case-management/domain/structures'
import { CollaboratorProfile } from '@hms/core/identity/domain/structures'

import { CaseTeamMemberSelector } from '@/ui/case-management/widgets/components/case-team-member-selector'
import { CaseDetailsPanel } from './case-details-panel'
import { InitialTeamSection } from './initial-team-section'
import { useCreateCasePage } from './use-create-case-page'
import { CreateCasePageHeading } from './create-case-page-heading'
import { CreateCaseFormActions } from './create-case-form-actions'

export const CreateCasePage = () => {
  const {
    form,
    canCreateCase,
    intakes,
    intakesQuery,
    intakeOpen,
    intakeSearch,
    legalAreas,
    legalTopics,
    selectedLegalAreaId,
    initialManager,
    caseOpeningSource,
    isLoadingCaseOpeningSource,
    caseOpeningSourceError,
    fields,
    teamMemberDetails,
    isCreatingCase,
    isManagerSelectorOpen,
    isTeamSelectorOpen,
    onSubmit,
    setIntakeOpen,
    setIntakeSearch,
    handleIntakeSelect,
    update,
    handleOpenManagerSelector,
    handleOpenTeamSelector,
    handleRemoveTeamMember,
    handleInitialManagerSelectorClose,
    handleInitialManagerSelect,
    handleTeamSelectorClose,
    handleTeamMemberSelect,
  } = useCreateCasePage()

  return (
    <div className='mt-3 flex w-full flex-col gap-8 pb-20 sm:gap-12'>
      <CreateCasePageHeading />
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 sm:space-y-12'>
        <CaseDetailsPanel
          form={form}
          intakes={intakes}
          isLoadingIntakes={intakesQuery.isLoading}
          intakeOpen={intakeOpen}
          intakeSearch={intakeSearch}
          legalAreas={legalAreas}
          legalTopics={legalTopics}
          selectedLegalAreaId={selectedLegalAreaId}
          onIntakeOpenChange={setIntakeOpen}
          onIntakeSearchChange={setIntakeSearch}
          onIntakeSelect={handleIntakeSelect}
        />
        <InitialTeamSection
          manager={initialManager}
          openingSource={caseOpeningSource ?? undefined}
          isLoadingSuggestion={isLoadingCaseOpeningSource}
          suggestionError={caseOpeningSourceError}
          managerError={form.formState.errors.initialManagerCollaboratorId?.message}
          fields={fields}
          members={teamMemberDetails}
          update={update}
          onSelectManager={handleOpenManagerSelector}
          onAddTeamMember={handleOpenTeamSelector}
          onRemoveTeamMember={handleRemoveTeamMember}
        />
        <CreateCaseFormActions isCreating={isCreatingCase} canCreate={canCreateCase} />
      </form>
      <CaseTeamMemberSelector
        open={isManagerSelectorOpen}
        onClose={handleInitialManagerSelectorClose}
        onSelect={handleInitialManagerSelect}
        requiredProfile={CollaboratorProfile.Lawyer}
        initialRole={CaseMemberRole.Manager}
        allowedRoles={[CaseMemberRole.Manager]}
      />
      <CaseTeamMemberSelector
        open={isTeamSelectorOpen}
        onClose={handleTeamSelectorClose}
        onSelect={handleTeamMemberSelect}
        initialRole={CaseMemberRole.Collaborator}
      />
    </div>
  )
}
