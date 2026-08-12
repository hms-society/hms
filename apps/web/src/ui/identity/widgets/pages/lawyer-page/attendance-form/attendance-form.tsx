import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { ArrowLeft, Check } from 'lucide-react'
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

const ORIGIN_MAP: Record<string, string> = {
  social_media: 'Redes Sociais',
  website: 'Website / Plataforma',
  referral: 'Indicação',
  phone: 'Telefone',
  active_search: 'Busca Ativa',
  direct: 'Entrada direta HMS',
}

export interface AttendanceFormProps {
  consultationId: string
  onBack?: () => void
}

export function AttendanceForm({
  consultationId,
  onBack,
}: AttendanceFormProps) {
  const {
    consultation,
    isLoading,
    completeConsultation,
    updateQualification,
  } = useConsultation(consultationId)

  const DRAFT_KEY = `consultation_draft_${consultationId}`

  const getDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  const draft = getDraft()

  const [isFactModalOpen, setIsFactModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingFact, setEditingFact] = useState<TimelineFact | null>(null)

  const [mainLegalQuestionError, setMainLegalQuestionError] = useState('')
  const [clientGuidanceError, setClientGuidanceError] = useState('')

  const client = consultation?.client
  const intake = consultation?.intake

  const rawOrigin =
    draft?.origin ?? client?.origin ?? intake?.origin ?? 'direct'

  const [personType, setPersonType] = useState<'individual' | 'legal'>(
    draft?.personType ?? (client?.type === 'legal' ? 'legal' : 'individual'),
  )

  const [fullName, setFullName] = useState(() => draft?.fullName ?? client?.name ?? '')
  const [cpf, setCpf] = useState(() => draft?.cpf ?? client?.taxIdValue ?? '')
  const [phone, setPhone] = useState(() => draft?.phone ?? client?.phone ?? '')
  const [email, setEmail] = useState(() => draft?.email ?? client?.email ?? '')
  const [origin] = useState(
    () => ORIGIN_MAP[rawOrigin] ?? rawOrigin ?? 'Entrada direta HMS',
  )
  const [linkedThirdParty, setLinkedThirdParty] = useState(
    () => draft?.linkedThirdParty ?? client?.linkedThirdParty ?? '',
  )

  const attendantNameResolved =
    (consultation as any)?.attendant?.name ||
    intake?.attendantName ||
    (consultation as any)?.intake?.responsible?.professionalName ||
    (consultation as any)?.intake?.responsible?.name ||
    ''

  const [hmsResponsible, setHmsResponsible] = useState(
    () => draft?.hmsResponsible || client?.hmsResponsible || attendantNameResolved,
  )

  const [rg, setRg] = useState(() => draft?.rg ?? client?.rg ?? '')
  const [birthDate, setBirthDate] = useState(() => draft?.birthDate ?? client?.birthDate ?? '')
  const [maritalStatus, setMaritalStatus] = useState(
    () => draft?.maritalStatus ?? client?.maritalStatus ?? '',
  )
  const [nationality, setNationality] = useState(
    () => draft?.nationality ?? client?.nationality ?? '',
  )
  const [profession, setProfession] = useState(
    () => draft?.profession ?? client?.profession ?? '',
  )

  const [companyName, setCompanyName] = useState(
    () => draft?.companyName ?? client?.legalName ?? client?.name ?? '',
  )
  const [tradeName, setTradeName] = useState(
    () => draft?.tradeName ?? client?.tradeName ?? '',
  )
  const [stateRegistration, setStateRegistration] = useState(
    () => draft?.stateRegistration ?? client?.stateRegistration ?? '',
  )
  const [constitutionDate, setConstitutionDate] = useState(
    () => draft?.constitutionDate ?? client?.constitutionDate ?? '',
  )
  const [legalNature, setLegalNature] = useState(
    () => draft?.legalNature ?? client?.legalNature ?? '',
  )
  const [legalRepresentative, setLegalRepresentative] = useState(
    () => draft?.legalRepresentative ?? client?.legalRepresentative ?? '',
  )
  const [representativeRole, setRepresentativeRole] = useState(
    () => draft?.representativeRole ?? client?.representativeRole ?? '',
  )

  const [cep, setCep] = useState(() => draft?.cep ?? client?.zipCode ?? '')
  const [street, setStreet] = useState(() => draft?.street ?? client?.street ?? '')
  const [number, setNumber] = useState(() => draft?.number ?? client?.number ?? '')
  const [complement, setComplement] = useState(
    () => draft?.complement ?? client?.complement ?? '',
  )
  const [neighborhood, setNeighborhood] = useState(
    () => draft?.neighborhood ?? client?.district ?? '',
  )
  const [city, setCity] = useState(
    () => draft?.city ?? client?.city ?? 'São José dos Campos',
  )
  const [uf, setUf] = useState(() => draft?.uf ?? client?.state ?? 'SP')

  const intakeAreaId = intake?.legalAreaId || ''
  const intakeTopicId = intake?.legalTopicId || ''

  const [legalAreaId, setLegalAreaId] = useState(() => draft?.legalAreaId ?? intakeAreaId)
  const [legalTopicId, setLegalTopicId] = useState(() => draft?.legalTopicId ?? intakeTopicId)

  const [selectedFormName, setSelectedFormName] = useState(
    () => draft?.selectedFormName ?? 'Triagem inicial',
  )

  const [facts, setFacts] = useState<TimelineFact[]>(
    () =>
      draft?.facts ||
      consultation?.relevantFacts?.map((fact: any) => ({
        id: fact.id || crypto.randomUUID(),
        date: fact.occurredOn
          ? new Date(fact.occurredOn).toLocaleDateString('pt-BR')
          : 'S/D',
        description: fact.description,
        status: 'Comprovado',
      })) ||
      [],
  )

  const [claims, setClaims] = useState<LegalClaim[]>(
    () =>
      draft?.claims ||
      consultation?.potentialLegalRequests?.map((req: any) => ({
        id: req.id || crypto.randomUUID(),
        title: req.description || req.title,
        summary: req.summary || '',
      })) ||
      [],
  )

  const [lawyerNotes, setLawyerNotes] = useState(
    () => draft?.lawyerNotes ?? consultation?.notes ?? '',
  )
  const [mainLegalQuestion, setMainLegalQuestion] = useState(
    () => draft?.mainLegalQuestion ?? consultation?.primaryLegalQuestion ?? '',
  )
  const [clientGuidance, setClientGuidance] = useState(
    () => draft?.clientGuidance ?? consultation?.guidanceProvided ?? '',
  )
  const [viability, setViability] = useState(() => draft?.viability ?? 'Viável')
  const [decision, setDecision] = useState(
    () => draft?.decision ?? 'Prosseguir para contratação',
  )

  useEffect(() => {
    if (consultation && !hmsResponsible) {
      const resolved =
        (consultation as any)?.attendant?.name ||
        consultation.intake?.attendantName ||
        (consultation as any)?.intake?.responsible?.professionalName ||
        ''

      if (resolved) {
        setHmsResponsible(resolved)
      }
    }
  }, [consultation, hmsResponsible])

  useEffect(() => {
    if (!consultationId || isLoading) return

    const dataToSave = {
      personType,
      fullName,
      cpf,
      phone,
      email,
      origin,
      linkedThirdParty,
      hmsResponsible,
      rg,
      birthDate,
      maritalStatus,
      nationality,
      profession,
      companyName,
      tradeName,
      stateRegistration,
      constitutionDate,
      legalNature,
      legalRepresentative,
      representativeRole,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      uf,
      legalAreaId,
      legalTopicId,
      selectedFormName,
      facts,
      claims,
      lawyerNotes,
      mainLegalQuestion,
      clientGuidance,
      viability,
      decision,
    }

    localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave))
  }, [
    consultationId,
    isLoading,
    personType,
    fullName,
    cpf,
    phone,
    email,
    origin,
    linkedThirdParty,
    hmsResponsible,
    rg,
    birthDate,
    maritalStatus,
    nationality,
    profession,
    companyName,
    tradeName,
    stateRegistration,
    constitutionDate,
    legalNature,
    legalRepresentative,
    representativeRole,
    cep,
    street,
    number,
    complement,
    neighborhood,
    city,
    uf,
    legalAreaId,
    legalTopicId,
    selectedFormName,
    facts,
    claims,
    lawyerNotes,
    mainLegalQuestion,
    clientGuidance,
    viability,
    decision,
  ])

  const { legalCatalogService } = useRestContext()

  const { data: areasData } = useQuery({
    queryKey: ['legal-areas'],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalAreas()

      if (response.isFailure) {
        return []
      }

      return (response.body as LegalAreaOption[]) ?? []
    },
  })

  const { data: topicsData } = useQuery({
    queryKey: ['legal-topics', legalAreaId],
    queryFn: async () => {
      if (!legalAreaId) {
        return []
      }

      const response =
        await legalCatalogService.listLegalTopics(legalAreaId)

      if (response.isFailure) {
        return []
      }

      return (response.body as LegalTopicOption[]) ?? []
    },
    enabled: Boolean(legalAreaId),
  })

  const areasList = areasData ?? []
  const topicsList = topicsData ?? []

  const currentAreaName =
    areasList.find((area) => area.id === legalAreaId)?.name || '—'

  const currentTopicName =
    topicsList.find((topic) => topic.id === legalTopicId)?.name || '—'

  const handleSaveFact = (newFact: {
    id?: string
    date: string
    description: string
    status: string
  }) => {
    setFacts((prev) => {
      if (newFact.id) {
        return prev.map((f) =>
          f.id === newFact.id
            ? {
                ...f,
                date: newFact.date,
                description: newFact.description,
                status: newFact.status,
              }
            : f,
        )
      }

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          date: newFact.date,
          description: newFact.description,
          status: newFact.status,
        },
      ]
    })
  }

  const handleSaveClaim = (newClaim: {
    id?: string
    title: string
    summary: string
  }) => {
    setClaims((prev) => {
      if (newClaim.id) {
        return prev.map((claim) =>
          claim.id === newClaim.id
            ? { ...claim, title: newClaim.title, summary: newClaim.summary }
            : claim,
        )
      }

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          title: newClaim.title,
          summary: newClaim.summary,
        },
      ]
    })
  }

  const handleFinalize = async () => {
    if (!consultationId) {
      return
    }

    let hasError = false

    if (!mainLegalQuestion || !mainLegalQuestion.trim()) {
      setMainLegalQuestionError('A questão jurídica principal é obrigatória.')
      hasError = true
    }

    if (!clientGuidance || !clientGuidance.trim()) {
      setClientGuidanceError('A orientação prestada ao cliente é obrigatória.')
      hasError = true
    }

    if (hasError) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      return
    }

    setMainLegalQuestionError('')
    setClientGuidanceError('')

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
          rg: personType === 'individual' ? rg : undefined,
          birthDate: personType === 'individual' ? birthDate : undefined,
          maritalStatus: personType === 'individual' ? maritalStatus : undefined,
          nationality: personType === 'individual' ? nationality : undefined,
          profession: personType === 'individual' ? profession : undefined,
          stateRegistration: personType === 'legal' ? stateRegistration : undefined,
          constitutionDate: personType === 'legal' ? constitutionDate : undefined,
          legalNature: personType === 'legal' ? legalNature : undefined,
          legalRepresentative: personType === 'legal' ? legalRepresentative : undefined,
          representativeRole: personType === 'legal' ? representativeRole : undefined,
        } as any)
      }

      if (completeConsultation) {
        await completeConsultation({
          consultationId,
          legalAreaId: legalAreaId || undefined,
          legalTopicId: legalTopicId || undefined,
          primaryLegalQuestion: mainLegalQuestion || undefined,
          guidanceProvided: clientGuidance || undefined,
          notes: lawyerNotes || undefined,
          viability: viability || undefined,
          decision: decision || undefined,
          relevantFacts: facts.map((fact) => ({
            id: fact.id,
            description: fact.description,
            date: fact.date !== 'S/D' ? fact.date : undefined,
          })),
          potentialLegalRequests: claims.map((claim) => ({
            id: claim.id,
            title: claim.title,
            summary: claim.summary,
          })),
        } as any)
      }

      localStorage.removeItem(DRAFT_KEY)
      localStorage.removeItem(`extra_client_fields_${consultationId}`)

      if (onBack) {
        onBack()
      }
    } catch (error) {
      console.error('Erro ao finalizar consulta:', error)
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
      />

      <LegalAreaSection
        legalAreaId={legalAreaId}
        setLegalAreaId={(id) => {
          setLegalAreaId(id)
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
        onOpenSelectModal={() => setIsFormModalOpen(true)}
      />

      <TimelineSection
        facts={facts}
        onRemoveFact={(id) =>
          setFacts((prev) =>
            prev.filter((fact) => fact.id !== id),
          )
        }
        onEditFact={(fact) => {
          setEditingFact(fact)
          setIsFactModalOpen(true)
        }}
        onOpenAddModal={() => {
          setEditingFact(null)
          setIsFactModalOpen(true)
        }}
      />

      <ClaimsSection
        claims={claims}
        onAddClaim={handleSaveClaim}
        onRemoveClaim={(id) =>
          setClaims((prev) => prev.filter((claim) => claim.id !== id))
        }
      />

      <LawyerNotesSection
        lawyerNotes={lawyerNotes}
        setLawyerNotes={setLawyerNotes}
      />

      <ConclusionSection
        mainLegalQuestion={mainLegalQuestion}
        setMainLegalQuestion={(val) => {
          setMainLegalQuestion(val)
          if (val.trim()) setMainLegalQuestionError('')
        }}
        clientGuidance={clientGuidance}
        setClientGuidance={(val) => {
          setClientGuidance(val)
          if (val.trim()) setClientGuidanceError('')
        }}
        viability={viability}
        setViability={setViability}
        decision={decision}
        setDecision={setDecision}
        errorMessage={mainLegalQuestionError}
        guidanceErrorMessage={clientGuidanceError}
      />

      <div className="flex items-center justify-end pt-4 border-t border-slate-200">
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
        onClose={() => {
          setIsFactModalOpen(false)
          setEditingFact(null)
        }}
        factToEdit={editingFact}
        onAdd={handleSaveFact}
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