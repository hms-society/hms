import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { ArrowLeft, Check, FileClock } from 'lucide-react'
import { Button } from '@/ui/shadcn/button'

import { AddFactDialog } from './add-fact'
import { SelectFormDialog } from './select-form'
import { useConsultation } from '../use-consultation'

import { QualificationSection } from './sections/qualification-section'
import {
  LegalAreaSection,
  type LegalAreaOption,
  type LegalTopicOption,
} from './sections/legal-area-section'
import { SelectedFormSection } from './sections/selected-form-section'
import { TimelineSection, type TimelineFact } from './sections/timeline-section'
import { ClaimsSection, type LegalClaim } from './sections/claim-section'
import { LawyerNotesSection } from './sections/lawyer-notes-section'
import { ConclusionSection } from './sections/conclusion-section'

export interface AttendanceFormProps {
  consultationId: string
  onBack?: () => void
}

export function AttendanceForm({ consultationId, onBack }: AttendanceFormProps) {
  const { consultation, isLoading, completeConsultation, updateQualification } =
    useConsultation(consultationId)

  const [isFactModalOpen, setIsFactModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const client = consultation?.client
  const intake = consultation?.intake

  const [personType, setPersonType] = useState<'individual' | 'legal'>(() =>
    client?.type === 'legal' ? 'legal' : 'individual',
  )

  const [fullName, setFullName] = useState(
    () => client?.name || intake?.clientName || '',
  )
  const [cpf, setCpf] = useState(
    () => client?.taxIdValue || client?.cpf || intake?.cpf || '',
  )
  const [phone, setPhone] = useState(
    () => client?.phone || intake?.phone || '',
  )
  const [email, setEmail] = useState(
    () => client?.email || intake?.email || '',
  )
  const [origin, setOrigin] = useState(
    () => client?.origin || intake?.channel || 'Entrada direta HMS',
  )
  const [linkedThirdParty, setLinkedThirdParty] = useState(
    () => client?.linkedThirdParty || '',
  )
  const [hmsResponsible, setHmsResponsible] = useState('')
  const [rg, setRg] = useState(() => client?.rg || '')
  const [birthDate, setBirthDate] = useState(() => client?.birthDate || '')
  const [maritalStatus, setMaritalStatus] = useState(
    () => client?.maritalStatus || '',
  )
  const [nationality, setNationality] = useState(
    () => client?.nationality || '',
  )
  const [profession, setProfession] = useState(
    () => client?.profession || '',
  )

  const [companyName, setCompanyName] = useState(
    () => client?.legalName || intake?.companyName || client?.name || '',
  )
  const [tradeName, setTradeName] = useState(
    () => client?.tradeName || intake?.tradeName || '',
  )
  const [stateRegistration, setStateRegistration] = useState(
    () => client?.stateRegistration || '',
  )
  const [constitutionDate, setConstitutionDate] = useState(
    () => client?.constitutionDate || '',
  )
  const [legalNature, setLegalNature] = useState(
    () => client?.legalNature || '',
  )
  const [legalRepresentative, setLegalRepresentative] = useState(
    () =>
      client?.legalRepresentative ||
      intake?.representativeName ||
      '',
  )
  const [representativeRole, setRepresentativeRole] = useState(
    () =>
      client?.representativeRole ||
      intake?.representativeRole ||
      '',
  )

  const [cep, setCep] = useState(
    () => client?.zipCode || intake?.zipCode || '',
  )
  const [street, setStreet] = useState(
    () => client?.street || intake?.street || '',
  )
  const [number, setNumber] = useState(
    () => client?.number || intake?.number || '',
  )
  const [complement, setComplement] = useState(
    () => client?.complement || intake?.complement || '',
  )
  const [neighborhood, setNeighborhood] = useState(
    () => client?.district || intake?.district || '',
  )
  const [city, setCity] = useState(
    () => client?.city || intake?.city || 'São José dos Campos',
  )
  const [uf, setUf] = useState(
    () => client?.state || intake?.state || 'SP',
  )

  const initialAreaId = intake?.legalAreaId ?? ''
  const initialTopicId = intake?.legalTopicId ?? ''

  const [legalAreaId, setLegalAreaId] = useState(initialAreaId)
  const [legalTopicId, setLegalTopicId] = useState(initialTopicId)

  const [selectedFormName, setSelectedFormName] =
    useState('Triagem inicial')

  const [facts, setFacts] = useState<TimelineFact[]>(
    () =>
      consultation?.relevantFacts?.map((fact: any) => ({
        id: fact.id || crypto.randomUUID(),
        date: fact.occurredOn
          ? new Date(fact.occurredOn).toLocaleDateString('pt-BR')
          : 'S/D',
        description: fact.description,
        status: 'Comprovado',
      })) || [],
  )

  const [claims, setClaims] = useState<LegalClaim[]>(
    () =>
      consultation?.potentialLegalRequests?.map((req: any) => ({
        id: req.id || crypto.randomUUID(),
        title: req.description,
        summary: '',
      })) || [],
  )

  const [lawyerNotes, setLawyerNotes] = useState(
    () => consultation?.notes || '',
  )
  const [mainLegalQuestion, setMainLegalQuestion] = useState(
    () => consultation?.primaryLegalQuestion || '',
  )
  const [clientGuidance, setClientGuidance] = useState(
    () => consultation?.guidanceProvided || '',
  )
  const [viability, setViability] = useState('Viável')
  const [decision, setDecision] = useState(
    'Prosseguir para contratação',
  )

  const { legalCatalogService } = useRestContext()

  const { data: areasData } = useQuery({
    queryKey: ['legal-areas'],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalAreas()

      if (response.isFailure) return []

      return (response.body as LegalAreaOption[]) ?? []
    },
  })

  const activeAreaIdForQuery = legalAreaId

  const { data: topicsData } = useQuery({
    queryKey: ['legal-topics', activeAreaIdForQuery],
    queryFn: async () => {
      if (!activeAreaIdForQuery) return []

      const response =
        await legalCatalogService.listLegalTopics(
          activeAreaIdForQuery,
        )

      if (response.isFailure) return []

      return (response.body as LegalTopicOption[]) ?? []
    },
    enabled: Boolean(activeAreaIdForQuery),
  })

  const areasList = areasData ?? []
  const topicsList = topicsData ?? []

  const currentAreaName =
    areasList.find((area) => area.id === legalAreaId)?.name ?? '—'

  const currentTopicName =
    topicsList.find((topic) => topic.id === legalTopicId)?.name ?? '—'

  const handleFinalize = async () => {
    if (!consultationId) return

    try {
      setIsSubmitting(true)

      if (updateQualification) {
        await updateQualification({
          name:
            personType === 'individual'
              ? fullName
              : undefined,
          legalName:
            personType === 'legal'
              ? companyName || fullName
              : undefined,
          tradeName:
            personType === 'legal'
              ? tradeName
              : undefined,
          taxIdValue: cpf,
          phone,
          email,
          origin,
          linkedThirdParty:
            linkedThirdParty || undefined,
          hmsResponsible,
          zipCode: cep,
          street,
          number,
          complement,
          district: neighborhood,
          city,
          state: uf,
        })
      }

      if (completeConsultation) {
        await completeConsultation(consultationId)
      }

      if (onBack) onBack()
    } catch (error) {
      console.error(
        'Erro ao finalizar consulta:',
        error,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Carregando dados da ficha...
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-teal-800 hover:text-teal-900 font-medium cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar
      </button>

      <QualificationSection
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
      />

      <LegalAreaSection
        legalAreaId={legalAreaId}
        setLegalAreaId={(newAreaId) => {
          setLegalAreaId(newAreaId)
          setLegalTopicId('')
        }}
        legalTopicId={legalTopicId}
        setLegalTopicId={setLegalTopicId}
        areasList={areasList}
        topicsList={topicsList}
      />

      <SelectedFormSection
        selectedFormName={selectedFormName}
        legalArea={currentAreaName}
        legalTheme={currentTopicName}
        onOpenSelectModal={() =>
          setIsFormModalOpen(true)
        }
      />

      <TimelineSection
        facts={facts}
        onRemoveFact={(id) =>
          setFacts((prev) =>
            prev.filter((fact) => fact.id !== id),
          )
        }
        onOpenAddModal={() =>
          setIsFactModalOpen(true)
        }
      />

      <ClaimsSection claims={claims} />

      <LawyerNotesSection
        lawyerNotes={lawyerNotes}
        setLawyerNotes={setLawyerNotes}
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
      />

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <FileClock className="w-3.5 h-3.5" />
          Rascunho salvo
        </span>

        <Button
          onClick={handleFinalize}
          disabled={isSubmitting}
          className="bg-teal-800 hover:bg-teal-900 text-white rounded-full px-8 h-11 text-xs font-bold gap-2 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {isSubmitting
            ? 'Finalizando...'
            : 'Finalizar consulta'}
        </Button>
      </div>

      <AddFactDialog
        isOpen={isFactModalOpen}
        onClose={() => setIsFactModalOpen(false)}
        onAdd={(newFact) =>
          setFacts((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              ...newFact,
            },
          ])
        }
      />

      <SelectFormDialog
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSelect={(form) => {
          const selectedForm = form as unknown as {
            title: string
            legalAreaId?: string
            legalTopicId?: string
          }

          setSelectedFormName(selectedForm.title)

          if (selectedForm.legalAreaId) {
            setLegalAreaId(selectedForm.legalAreaId)
          }

          if (selectedForm.legalTopicId) {
            setLegalTopicId(selectedForm.legalTopicId)
          }
        }}
      />
    </div>
  )
}