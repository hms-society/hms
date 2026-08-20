import { ConsultationViability } from '@hms/core/consultation/domain/structures'
import { AddFactDialog } from './add-fact'
import { QualificationSection } from './sections/qualification-section'
import { LegalAreaSection } from './sections/legal-area-section'
import { TimelineSection } from './sections/timeline-section'
import { ClaimsSection } from './sections/claim-section'
import { LawyerNotesSection } from './sections/lawyer-notes-section'
import { ConclusionSection } from './sections/conclusion-section'
import { useAttendanceForm, type AttendanceFormProps } from './use-attendance-form'
import { Button } from '@/ui/shadcn/button'
import { Icon } from '@/ui/shared/widgets/components/icon'
import { SelectFormDialog } from '@/ui/shared/widgets/dynamic-form/select-form'
import { SelectedFormSection } from '@/ui/shared/widgets/dynamic-form/selected-form-section'
import { ConfirmConsultationClosureDialog } from '@/ui/intake/widgets/components/confirm-consultation-closure-dialog'

export type { AttendanceFormProps } from './use-attendance-form'

export const AttendanceForm = ({
  consultationId,
  onBack,
  onFinalized,
}: AttendanceFormProps) => {
  const {
    consultation,
    isLoading,
    isError,
    error,
    isFactModalOpen,
    isFormModalOpen,
    isClosureConfirmationOpen,
    closureReason,
    closureNotes,
    closureError,
    editingFact,
    mainLegalQuestionError,
    clientGuidanceError,
    validationErrors,
    isAttendanceFinalized,
    isEditingAttendance,
    editAttendanceError,
    personType,
    setPersonType,
    fullName,
    setFullName,
    cpf,
    setCpf,
    phone,
    setPhone,
    email,
    setEmail,
    origin,
    linkedThirdParty,
    setLinkedThirdParty,
    hmsResponsible,
    setHmsResponsible,
    rg,
    setRg,
    birthDate,
    setBirthDate,
    maritalStatus,
    setMaritalStatus,
    nationality,
    setNationality,
    profession,
    setProfession,
    companyName,
    setCompanyName,
    tradeName,
    setTradeName,
    stateRegistration,
    setStateRegistration,
    constitutionDate,
    setConstitutionDate,
    legalNature,
    setLegalNature,
    legalRepresentative,
    setLegalRepresentative,
    representativeRole,
    setRepresentativeRole,
    cep,
    setCep,
    street,
    setStreet,
    number,
    setNumber,
    complement,
    setComplement,
    neighborhood,
    setNeighborhood,
    city,
    setCity,
    uf,
    setUf,
    legalAreaId,
    handleChangeLegalArea,
    legalTopicId,
    setLegalTopicId,
    selectedFormName,
    selectedForm,
    dynamicFormAnswers,
    handleDynamicFormAnswerChange,
    facts,
    claims,
    lawyerNotes,
    setLawyerNotes,
    mainLegalQuestion,
    setMainLegalQuestion,
    clientGuidance,
    setClientGuidance,
    viability,
    setViability,
    decision,
    handleFinalize,
    handleOpenClosureConfirmation,
    handleClosureConfirmationChange,
    handleConfirmClosure,
    handleClosureReasonChange,
    handleClosureNotesChange,
    handleEditAttendance,
    isSubmitting,
    finalizationError,
    isAttendanceFormComplete,
    setDecision,
    areasList,
    topicsList,
    currentAreaName,
    currentTopicName,
    handleSaveFact,
    handleSaveClaim,
    handleOpenFactModal,
    handleEditFact,
    handleCloseFactModal,
    handleRemoveFact,
    handleRemoveClaim,
    handleOpenFormModal,
    handleCloseFormModal,
    handleSelectForm,
  } = useAttendanceForm({ consultationId, onBack, onFinalized })

  const isConsultationPending = consultation?.status === 'pending'
  const isReadOnly = !isConsultationPending || isAttendanceFinalized
  const isClosingWithoutContract = viability === ConsultationViability.NotViable

  if (isLoading) {
    return (
      <div className='p-12 text-center text-xs text-slate-500'>
        Carregando dados da ficha dinâmica...
      </div>
    )
  }

  if (isError) {
    return (
      <div className='rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center'>
        <h2 className='font-serif text-xl text-foreground'>
          Não foi possível carregar a ficha dinâmica
        </h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {error instanceof Error ? error.message : 'Tente novamente mais tarde.'}
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-6 pb-12 font-sans'>
      <QualificationSection
        consultationId={consultationId}
        personType={personType}
        setPersonType={setPersonType}
        fullName={fullName}
        setFullName={setFullName}
        cpf={cpf}
        setCpf={setCpf}
        rg={rg}
        setRg={setRg}
        birthDate={birthDate}
        setBirthDate={setBirthDate}
        maritalStatus={maritalStatus}
        setMaritalStatus={setMaritalStatus}
        nationality={nationality}
        setNationality={setNationality}
        profession={profession}
        setProfession={setProfession}
        companyName={companyName}
        setCompanyName={setCompanyName}
        tradeName={tradeName}
        setTradeName={setTradeName}
        stateRegistration={stateRegistration}
        setStateRegistration={setStateRegistration}
        constitutionDate={constitutionDate}
        setConstitutionDate={setConstitutionDate}
        legalNature={legalNature}
        setLegalNature={setLegalNature}
        legalRepresentative={legalRepresentative}
        setLegalRepresentative={setLegalRepresentative}
        representativeRole={representativeRole}
        setRepresentativeRole={setRepresentativeRole}
        phone={phone}
        setPhone={setPhone}
        email={email}
        setEmail={setEmail}
        origin={origin}
        linkedThirdParty={linkedThirdParty}
        setLinkedThirdParty={setLinkedThirdParty}
        hmsResponsible={hmsResponsible}
        setHmsResponsible={setHmsResponsible}
        cep={cep}
        setCep={setCep}
        street={street}
        setStreet={setStreet}
        number={number}
        setNumber={setNumber}
        complement={complement}
        setComplement={setComplement}
        neighborhood={neighborhood}
        setNeighborhood={setNeighborhood}
        city={city}
        setCity={setCity}
        uf={uf}
        setUf={setUf}
        isReadOnly={isReadOnly}
      />

      <LegalAreaSection
        legalAreaId={legalAreaId}
        setLegalAreaId={handleChangeLegalArea}
        legalTopicId={legalTopicId}
        setLegalTopicId={setLegalTopicId}
        areasList={areasList}
        topicsList={topicsList}
        isReadOnly={isReadOnly}
      />

      <SelectedFormSection
        key={selectedForm?.id ?? 'dynamic-form-empty'}
        selectedFormName={selectedFormName}
        legalArea={currentAreaName}
        legalTheme={currentTopicName}
        fields={selectedForm?.fields ?? []}
        answers={dynamicFormAnswers}
        errors={validationErrors}
        onChange={handleDynamicFormAnswerChange}
        onOpenSelectModal={handleOpenFormModal}
        isReadOnly={isReadOnly}
      />

      <TimelineSection
        facts={facts}
        onRemoveFact={handleRemoveFact}
        onEditFact={handleEditFact}
        onOpenAddModal={handleOpenFactModal}
        isReadOnly={isReadOnly}
      />

      <ClaimsSection
        claims={claims}
        onAddClaim={handleSaveClaim}
        onRemoveClaim={handleRemoveClaim}
        isReadOnly={isReadOnly}
      />

      <LawyerNotesSection
        lawyerNotes={lawyerNotes}
        setLawyerNotes={setLawyerNotes}
        isReadOnly={isReadOnly}
      />

      <ConclusionSection
        mainLegalQuestion={mainLegalQuestion}
        setMainLegalQuestion={setMainLegalQuestion}
        clientGuidance={clientGuidance}
        setClientGuidance={setClientGuidance}
        viability={viability}
        setViability={setViability}
        decision={decision}
        setDecision={setDecision}
        errorMessage={mainLegalQuestionError}
        guidanceErrorMessage={clientGuidanceError}
        viabilityErrorMessage={validationErrors.viability}
        decisionErrorMessage={validationErrors.decision}
        isReadOnly={isReadOnly}
      />

      <div className='space-y-3 border-t border-border pt-4'>
        {finalizationError && (
          <p className='text-right text-sm font-medium text-destructive' role='alert'>
            {finalizationError.message}
          </p>
        )}

        <div className='flex justify-end'>
          {isReadOnly && isAttendanceFinalized && isConsultationPending ? (
            <div className='flex flex-col items-end gap-2'>
              {editAttendanceError && (
                <p className='text-xs font-medium text-destructive'>
                  Não foi possível habilitar a edição da ficha. Tente novamente.
                </p>
              )}
              <Button
                type='button'
                variant='default'
                size='sm'
                onClick={() => void handleEditAttendance()}
                disabled={isEditingAttendance}
                className='rounded-full bg-primary px-5 text-xs text-primary-foreground hover:bg-primary/90'
              >
                <Icon name='pencil' className='size-3.5' />
                {isEditingAttendance ? 'Habilitando edição...' : 'Editar ficha'}
              </Button>
            </div>
          ) : isReadOnly ? (
            !isAttendanceFinalized && (
              <Button
                type='button'
                variant='default'
                size='sm'
                disabled
                className='rounded-full bg-primary px-5 text-xs text-primary-foreground'
              >
                <Icon name='check' className='size-3.5' />
                Finalizar ficha de atendimento
              </Button>
            )
          ) : isClosingWithoutContract ? (
            <Button
              type='button'
              variant='destructive'
              size='sm'
              onClick={handleOpenClosureConfirmation}
              disabled={isSubmitting || !isAttendanceFormComplete}
              className='rounded-full px-5 text-xs'
            >
              <Icon name='check' className='size-3.5' />
              {isSubmitting
                ? 'Encerrando sem contratação...'
                : 'Confirmar encerramento sem contratação'}
            </Button>
          ) : (
            <Button
              type='button'
              variant='default'
              size='sm'
              onClick={() => void handleFinalize()}
              disabled={isSubmitting || !isAttendanceFormComplete}
              className='rounded-full bg-primary px-5 text-xs text-primary-foreground hover:bg-primary/90'
            >
              <Icon name='check' className='size-3.5' />
              {isSubmitting ? 'Finalizando ficha...' : 'Finalizar ficha de atendimento'}
            </Button>
          )}
        </div>
      </div>

      <AddFactDialog
        isOpen={isFactModalOpen}
        onClose={handleCloseFactModal}
        factToEdit={editingFact}
        onAdd={handleSaveFact}
      />

      <SelectFormDialog
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSelect={handleSelectForm}
        initialLegalAreaId={legalAreaId}
        initialLegalTopicId={legalTopicId}
        initialSelectedFormId={selectedForm?.id}
      />

      <ConfirmConsultationClosureDialog
        open={isClosureConfirmationOpen}
        onOpenChange={handleClosureConfirmationChange}
        closureReason={closureReason}
        closureNotes={closureNotes}
        error={closureError}
        onClosureReasonChange={handleClosureReasonChange}
        onClosureNotesChange={handleClosureNotesChange}
        onConfirm={handleConfirmClosure}
        isPending={isSubmitting}
      />
    </div>
  )
}
