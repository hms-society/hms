import type { UseFormReturn } from 'react-hook-form'
import type { IntakeListItem } from '@hms/core/intake/domain/structures'
import type { CreateCaseData } from '@hms/validation/case-management'
import { CaseDescriptionField } from '../case-description-field'
import { CaseTitleField } from '../case-title-field'
import { IntakeSelector } from '../intake-selector'
import { LegalAreaTopicFields } from '../legal-area-topic-fields'
import { Label } from '@/ui/shadcn/label'

export type CaseDetailsPanelProps = {
  form: UseFormReturn<CreateCaseData>
  intakes: readonly IntakeListItem[]
  isLoadingIntakes: boolean
  intakeOpen: boolean
  intakeSearch: string
  legalAreas: readonly { id: string; name: string }[]
  legalTopics: readonly { id: string; name: string }[]
  selectedLegalAreaId: string
  onIntakeOpenChange: (open: boolean) => void
  onIntakeSearchChange: (search: string) => void
  onIntakeSelect: (intakeId: string, onChange: (value: string) => void) => void
}

export const CaseDetailsPanel = (props: CaseDetailsPanelProps) => (
  <section className='rounded-2xl border border-border bg-card p-6 sm:p-6 shadow-sm space-y-6'>
    <h2 className='text-[18px] font-semibold text-foreground mb-4 text-left'>
      Detalhes do Caso
    </h2>
    <div className='space-y-5'>
      <CaseTitleField
        register={props.form.register}
        error={props.form.formState.errors.title?.message}
      />
      <div className='space-y-2.5'>
        <Label className='text-[14px] font-medium'>
          Triagem de Origem<span className='text-destructive'>*</span>
        </Label>
        <IntakeSelector
          control={props.form.control}
          intakes={props.intakes}
          isLoading={props.isLoadingIntakes}
          isOpen={props.intakeOpen}
          search={props.intakeSearch}
          onOpenChange={props.onIntakeOpenChange}
          onSearchChange={props.onIntakeSearchChange}
          onSelectIntake={props.onIntakeSelect}
        />
        {props.form.formState.errors.intakeId && (
          <span className='text-xs text-destructive'>
            {props.form.formState.errors.intakeId.message}
          </span>
        )}
      </div>
      <LegalAreaTopicFields
        control={props.form.control}
        setValue={props.form.setValue}
        legalAreas={props.legalAreas}
        legalTopics={props.legalTopics}
        selectedLegalAreaId={props.selectedLegalAreaId}
        areaError={props.form.formState.errors.legalAreaId?.message}
        topicError={props.form.formState.errors.legalTopicId?.message}
      />
      <CaseDescriptionField register={props.form.register} />
    </div>
  </section>
)
