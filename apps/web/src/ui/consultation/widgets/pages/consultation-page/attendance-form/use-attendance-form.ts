import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ConsultationDecision,
  ConsultationViability,
} from '@hms/core/consultation/domain/structures'
import type { IntakeClosureReason } from '@hms/core/intake/domain/structures'
import { finalizeConsultationAttendanceSchema } from '@hms/validation/consultation'
import type { DynamicFormAnswerValue } from '@hms/core/shared/domain'
import { useAuthContext } from '@/ui/shared/contexts/auth-context/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { useConsultation } from '@/ui/consultation/hooks/use-consultation'
import type { LegalAreaOption, LegalTopicOption } from './sections/legal-area-section'
import type { LegalClaim } from './sections/claim-section'
import type { TimelineFact } from './sections/timeline-section'
import type { FormOption } from '@/ui/shared/widgets/dynamic-form/select-form/use-select-form'

const ORIGIN_MAP: Record<string, string> = {
  social_media: 'Redes Sociais',
  website: 'Website / Plataforma',
  referral: 'Indicação',
  phone: 'Telefone',
  active_search: 'Busca Ativa',
  direct: 'Entrada direta HMS',
}

export type AttendanceFormProps = {
  consultationId: string
  onBack?: () => void
  onFinalized?: (result: AttendanceFinalizationResult) => void | Promise<void>
}

export type AttendanceFinalizationResult = {
  closedWithoutContract: boolean
  intakeId: string
}

type NewFact = {
  id?: string
  date: string
  description: string
  status: string
}

type NewClaim = {
  id?: string
  title: string
  summary: string
}

type SelectedForm = FormOption

export function useAttendanceForm({
  consultationId,
  onBack,
  onFinalized,
}: AttendanceFormProps) {
  const {
    consultation,
    isLoading,
    isError,
    error,
    finalizeAttendance,
    editAttendance,
    isEditingAttendance,
    editAttendanceError,
  } = useConsultation(consultationId)
  const { user } = useAuthContext()

  const DRAFT_KEY = `consultation_draft_${consultationId}`

  function getDraft() {
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
  const [isClosureConfirmationOpen, setIsClosureConfirmationOpen] = useState(false)
  const [closureReason, setClosureReason] = useState<IntakeClosureReason | ''>('')
  const [closureNotes, setClosureNotes] = useState('')
  const [closureError, setClosureError] = useState<Error | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [finalizationError, setFinalizationError] = useState<Error | null>(null)
  const [editingFact, setEditingFact] = useState<TimelineFact | null>(null)
  const [mainLegalQuestionError, setMainLegalQuestionError] = useState('')
  const [clientGuidanceError, setClientGuidanceError] = useState('')

  const client = consultation?.client
  const intake = consultation?.intake
  const rawOrigin = draft?.origin ?? client?.origin ?? intake?.origin ?? 'direct'

  const [personType, setPersonType] = useState<'individual' | 'legal'>(
    draft?.personType ?? (client?.type === 'legal' ? 'legal' : 'individual'),
  )
  const [fullName, setFullName] = useState(() => draft?.fullName ?? client?.name ?? '')
  const [cpf, setCpf] = useState(() => draft?.cpf ?? client?.taxIdValue ?? '')
  const [phone, setPhone] = useState(() => draft?.phone ?? client?.phone ?? '')
  const [email, setEmail] = useState(() => draft?.email ?? client?.email ?? '')
  const [origin, setOrigin] = useState(
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
  const [birthDate, setBirthDate] = useState(
    () => draft?.birthDate ?? client?.birthDate ?? '',
  )
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
  const [city, setCity] = useState(() => draft?.city ?? client?.city ?? '')
  const [uf, setUf] = useState(() => draft?.uf ?? client?.state ?? '')
  const intakeAreaId = intake?.legalAreaId || ''
  const intakeTopicId = intake?.legalTopicId || ''
  const [legalAreaId, setLegalAreaId] = useState(() => draft?.legalAreaId ?? intakeAreaId)
  const [legalTopicId, setLegalTopicId] = useState(
    () => draft?.legalTopicId ?? intakeTopicId,
  )
  const [selectedForm, setSelectedForm] = useState<FormOption | null>(
    () => draft?.selectedForm ?? null,
  )
  const [dynamicFormAnswers, setDynamicFormAnswers] = useState<
    Record<string, DynamicFormAnswerValue>
  >(() => draft?.dynamicFormAnswers ?? {})
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
      consultation?.potentialLegalRequests?.map((request: any) => ({
        id: request.id || crypto.randomUUID(),
        title: request.description || request.title,
        summary: request.summary || '',
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
  const [viability, setViability] = useState(() => draft?.viability ?? '')
  const [decision, setDecision] = useState(() => draft?.decision ?? '')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const hasHydratedConsultation = useRef(false)
  const isAttendanceFinalized = Boolean(consultation?.attendanceFinalizedAt)
  const isConsultationPending = consultation?.status === 'pending'
  const hasStaleContextDraft = Boolean(
    consultation &&
      draft &&
      ((draft.legalAreaId &&
        consultation.legalAreaId &&
        draft.legalAreaId !== consultation.legalAreaId) ||
        (draft.legalTopicId &&
          consultation.legalTopicId &&
          draft.legalTopicId !== consultation.legalTopicId)),
  )

  useEffect(() => {
    if (!consultation || !hasStaleContextDraft) return

    localStorage.removeItem(DRAFT_KEY)
    setLegalAreaId(consultation.legalAreaId)
    setLegalTopicId(consultation.legalTopicId)
    setSelectedForm(null)
    setDynamicFormAnswers({})
    setValidationErrors({})
  }, [consultation, hasStaleContextDraft, DRAFT_KEY])

  useEffect(() => {
    if (!consultation || draft || hasHydratedConsultation.current) return

    hasHydratedConsultation.current = true
    const loadedClient = consultation.client as any
    const loadedIntake = consultation.intake as any
    const loadedAddress = loadedClient?.address
    const loadedTaxId = loadedClient?.taxId?.value || loadedClient?.taxIdValue
    const loadedName =
      loadedClient?.name || loadedClient?.legalName || loadedClient?.tradeName
    const loadedResponsible =
      (consultation as any).responsible?.professionalName ||
      (consultation as any).attendant?.name ||
      loadedIntake?.responsible?.professionalName ||
      loadedIntake?.attendantName

    setPersonType((current: 'individual' | 'legal') =>
      current === 'individual' && loadedClient?.type === 'legal' ? 'legal' : current,
    )
    setFullName((current: string) => current || loadedName || '')
    setCpf((current: string) => current || loadedTaxId || '')
    setPhone((current: string) => current || loadedClient?.phone || '')
    setEmail((current: string) => current || loadedClient?.email || '')
    setOrigin((current: string) =>
      current === 'Entrada direta HMS'
        ? ORIGIN_MAP[loadedIntake?.origin] || loadedIntake?.origin || current
        : current,
    )
    setHmsResponsible((current: string) => current || loadedResponsible || '')
    setCompanyName(
      (current: string) => current || loadedClient?.legalName || loadedClient?.name || '',
    )
    setTradeName((current: string) => current || loadedClient?.tradeName || '')
    setCep(
      (current: string) =>
        current || loadedAddress?.zipCode || loadedClient?.zipCode || '',
    )
    setStreet(
      (current: string) => current || loadedAddress?.street || loadedClient?.street || '',
    )
    setNumber(
      (current: string) => current || loadedAddress?.number || loadedClient?.number || '',
    )
    setComplement(
      (current: string) =>
        current || loadedAddress?.complement || loadedClient?.complement || '',
    )
    setNeighborhood(
      (current: string) =>
        current || loadedAddress?.district || loadedClient?.district || '',
    )
    setCity(
      (current: string) => current || loadedAddress?.city || loadedClient?.city || '',
    )
    setUf(
      (current: string) => current || loadedAddress?.state || loadedClient?.state || '',
    )
    setLegalAreaId((current: string) =>
      draft
        ? current || loadedIntake?.legalAreaId || ''
        : consultation.legalAreaId || loadedIntake?.legalAreaId || '',
    )
    setLegalTopicId((current: string) =>
      draft
        ? current || loadedIntake?.legalTopicId || ''
        : consultation.legalTopicId || loadedIntake?.legalTopicId || '',
    )
    setFacts((current: TimelineFact[]) =>
      current.length > 0
        ? current
        : (consultation.relevantFacts || []).map((fact: any) => ({
            id: fact.id || crypto.randomUUID(),
            date: fact.occurredOn
              ? new Date(fact.occurredOn).toLocaleDateString('pt-BR')
              : 'S/D',
            description: fact.description,
            status: 'Comprovado',
          })),
    )
    setClaims((current: LegalClaim[]) =>
      current.length > 0
        ? current
        : (consultation.potentialLegalRequests || []).map((request: any) => ({
            id: request.id || crypto.randomUUID(),
            title: request.description || request.title,
            summary: request.summary || '',
          })),
    )
    setLawyerNotes((current: string) => current || consultation.notes || '')
    setMainLegalQuestion(
      (current: string) => current || consultation.primaryLegalQuestion || '',
    )
    setClientGuidance((current: string) => current || consultation.guidanceProvided || '')
    if (!selectedForm && consultation.dynamicFormSnapshot) {
      setSelectedForm({
        id: consultation.dynamicFormSnapshot.dynamicFormId,
        title: consultation.dynamicFormSnapshot.name,
        legalTopicIds: [],
        fields: [...consultation.dynamicFormSnapshot.fields],
      })
    }
    setDynamicFormAnswers((current) =>
      Object.keys(current).length > 0
        ? current
        : Object.fromEntries(
            (consultation.dynamicFormAnswers ?? []).map((answer: any) => [
              answer.fieldId,
              answer.value,
            ]),
          ),
    )
    setViability((current: string) => current || consultation.viability || '')
    setDecision((current: string) => current || consultation.decision || '')
  }, [consultation, draft, selectedForm])

  useEffect(() => {
    if (consultation && !hmsResponsible) {
      const resolved =
        (consultation as any)?.attendant?.name ||
        consultation.intake?.attendantName ||
        (consultation as any)?.intake?.responsible?.professionalName ||
        ''

      if (resolved) setHmsResponsible(resolved)
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
      selectedForm,
      dynamicFormAnswers,
      facts,
      claims,
      lawyerNotes,
      mainLegalQuestion,
      clientGuidance,
      viability,
      decision,
      DRAFT_KEY,
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
    selectedForm,
    dynamicFormAnswers,
    facts,
    claims,
    lawyerNotes,
    mainLegalQuestion,
    clientGuidance,
    viability,
    decision,
    DRAFT_KEY,
  ])

  const { intakeService, legalCatalogService } = useRestContext()
  const { data: areasData } = useQuery({
    queryKey: ['legal-areas'],
    queryFn: async () => {
      const response = await legalCatalogService.listLegalAreas()
      if (response.isFailure) return []
      return (response.body as LegalAreaOption[]) ?? []
    },
  })
  const { data: topicsData } = useQuery({
    queryKey: ['legal-topics', legalAreaId],
    queryFn: async () => {
      if (!legalAreaId) return []
      const response = await legalCatalogService.listLegalTopics(legalAreaId)
      if (response.isFailure) return []
      return (response.body as LegalTopicOption[]) ?? []
    },
    enabled: Boolean(legalAreaId),
  })
  const areasList = areasData ?? []
  const topicsList = topicsData ?? []
  const currentAreaName = areasList.find((area) => area.id === legalAreaId)?.name || '—'
  const currentTopicName =
    topicsList.find((topic) => topic.id === legalTopicId)?.name || '—'

  function handleSaveFact(newFact: NewFact) {
    setFacts((previous) => {
      if (newFact.id) {
        return previous.map((fact) =>
          fact.id === newFact.id
            ? {
                ...fact,
                date: newFact.date,
                description: newFact.description,
                status: newFact.status,
              }
            : fact,
        )
      }
      return [
        ...previous,
        {
          id: crypto.randomUUID(),
          date: newFact.date,
          description: newFact.description,
          status: newFact.status,
        },
      ]
    })
  }

  function handleSaveClaim(newClaim: NewClaim) {
    setClaims((previous) => {
      if (newClaim.id) {
        return previous.map((claim) =>
          claim.id === newClaim.id
            ? { ...claim, title: newClaim.title, summary: newClaim.summary }
            : claim,
        )
      }
      return [
        ...previous,
        { id: crypto.randomUUID(), title: newClaim.title, summary: newClaim.summary },
      ]
    })
  }

  function buildFinalizePayload() {
    const modality =
      consultation?.modality === 'virtual' || consultation?.modality === 'VIRTUAL'
        ? 'virtual'
        : 'in_person'
    const answers = Object.entries(dynamicFormAnswers).map(([fieldId, value]) => ({
      fieldId,
      value,
    }))

    return {
      legalAreaId,
      legalTopicId,
      modality,
      channel: consultation?.channel,
      primaryLegalQuestion: mainLegalQuestion,
      guidanceProvided: clientGuidance,
      viability,
      decision,
      dynamicFormId: selectedForm?.id,
      answers,
      notes: lawyerNotes,
      relevantFacts: facts.map((fact) => ({
        id: fact.id,
        description: fact.description,
        date: fact.date !== 'S/D' ? fact.date : undefined,
      })),
      potentialLegalRequests: claims.map((claim) => ({
        title: claim.title,
        summary: claim.summary,
      })),
    }
  }

  function getMissingDynamicField() {
    return selectedForm?.fields.find((field) => {
      if (!field.required) return false
      const value = dynamicFormAnswers[field.id]
      return (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && !value.trim()) ||
        (Array.isArray(value) && value.length === 0)
      )
    })
  }

  const isDynamicFormReady = !consultation?.dynamicFormSnapshot || Boolean(selectedForm)
  const isAttendanceFormComplete =
    Boolean(consultationId) &&
    isConsultationPending &&
    isDynamicFormReady &&
    !getMissingDynamicField() &&
    finalizeConsultationAttendanceSchema.safeParse(buildFinalizePayload()).success

  async function handleFinalize(shouldNavigate = true) {
    if (!consultationId) return false
    setFinalizationError(null)
    const missingDynamicField = getMissingDynamicField()

    if (missingDynamicField) {
      setValidationErrors({
        [`field:${missingDynamicField.id}`]: `Preencha o campo obrigatório "${missingDynamicField.label}".`,
      })
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      return false
    }
    const result = finalizeConsultationAttendanceSchema.safeParse(buildFinalizePayload())

    if (!result.success) {
      const errors = Object.fromEntries(
        result.error.issues.map((issue) => [
          String(issue.path[0] ?? 'form'),
          issue.message,
        ]),
      )
      setValidationErrors(errors)
      setMainLegalQuestionError(errors.primaryLegalQuestion ?? '')
      setClientGuidanceError(errors.guidanceProvided ?? '')
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      return false
    }
    setValidationErrors({})
    setMainLegalQuestionError('')
    setClientGuidanceError('')
    try {
      setIsSubmitting(true)
      await finalizeAttendance(result.data)
      localStorage.removeItem(DRAFT_KEY)
      localStorage.removeItem(`extra_client_fields_${consultationId}`)
      if (shouldNavigate) {
        if (onFinalized) {
          await onFinalized({
            closedWithoutContract: false,
            intakeId: consultation?.intakeId ?? '',
          })
        } else {
          onBack?.()
        }
      }
      return true
    } catch (finalizeError) {
      console.error('Erro ao finalizar consulta:', finalizeError)
      setFinalizationError(
        finalizeError instanceof Error
          ? finalizeError
          : new Error('Não foi possível finalizar a ficha de atendimento.'),
      )
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenClosureConfirmation() {
    setClosureError(null)
    setIsClosureConfirmationOpen(true)
  }

  function handleClosureConfirmationChange(isOpen: boolean) {
    setIsClosureConfirmationOpen(isOpen)
  }

  async function handleConfirmClosure() {
    if (!closureReason) {
      setClosureError(new Error('Selecione um motivo para encerrar o Intake.'))
      return
    }

    if (!consultation?.intakeId || !consultation.intake?.version || !user) {
      setClosureError(new Error('Não foi possível identificar o Intake atual.'))
      return
    }

    const wasFinalized = await handleFinalize(false)
    if (!wasFinalized) return

    try {
      setIsSubmitting(true)
      const response = await intakeService.closeIntakeWithoutContract(
        consultation.intakeId,
        {
          expectedVersion: consultation.intake.version,
          closureReason,
          closureNotes: closureNotes.trim() || undefined,
          updatedBy: user.id,
        },
      )

      if (response.isFailure) response.throwError()

      setClosureError(null)
      setClosureReason('')
      setClosureNotes('')
      setIsClosureConfirmationOpen(false)
      if (onFinalized) {
        await onFinalized({
          closedWithoutContract: true,
          intakeId: consultation.intakeId,
        })
      } else {
        onBack?.()
      }
      return true
    } catch (error) {
      setClosureError(
        error instanceof Error ? error : new Error('Não foi possível encerrar o Intake.'),
      )
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEditAttendance() {
    try {
      await editAttendance()
    } catch (editError) {
      console.error('Erro ao habilitar edição da ficha:', editError)
    }
  }

  function handleOpenFactModal() {
    setEditingFact(null)
    setIsFactModalOpen(true)
  }

  function handleEditFact(fact: TimelineFact) {
    setEditingFact(fact)
    setIsFactModalOpen(true)
  }

  function handleCloseFactModal() {
    setIsFactModalOpen(false)
    setEditingFact(null)
  }

  function handleRemoveFact(id: string) {
    setFacts((previous) => previous.filter((fact) => fact.id !== id))
  }

  function handleRemoveClaim(id: string) {
    setClaims((previous) => previous.filter((claim) => claim.id !== id))
  }

  function handleChangeLegalArea(id: string) {
    setLegalAreaId(id)
    setLegalTopicId('')
  }

  function handleOpenFormModal() {
    setIsFormModalOpen(true)
  }

  function handleCloseFormModal() {
    setIsFormModalOpen(false)
  }

  function handleSelectForm(nextForm: SelectedForm) {
    const isSameForm = selectedForm?.id === nextForm.id

    setSelectedForm(nextForm as FormOption)
    setValidationErrors({})

    if (!isSameForm) {
      setDynamicFormAnswers({})
    }

    if (nextForm.legalAreaId) {
      setLegalAreaId(nextForm.legalAreaId)
    }

    setLegalTopicId((currentTopicId: string) =>
      nextForm.legalTopicIds.includes(currentTopicId)
        ? currentTopicId
        : (nextForm.legalTopicIds[0] ?? ''),
    )
  }

  function handleMainLegalQuestionChange(value: string) {
    setMainLegalQuestion(value)
    if (value.trim()) setMainLegalQuestionError('')
  }

  function handleClientGuidanceChange(value: string) {
    setClientGuidance(value)
    if (value.trim()) setClientGuidanceError('')
  }

  function handleViabilityChange(value: string) {
    setViability(value)

    if (value === ConsultationViability.NotViable) {
      setDecision(ConsultationDecision.CloseWithoutContract)
    } else if (decision === ConsultationDecision.CloseWithoutContract) {
      setDecision('')
      setClosureReason('')
      setClosureNotes('')
      setClosureError(null)
    }

    setValidationErrors(clearDecisionValidationErrors)
  }

  function handleDecisionChange(value: string) {
    if (viability === ConsultationViability.NotViable) return

    setDecision(value)
    setValidationErrors(clearDecisionValidationErrors)
  }

  function clearDecisionValidationErrors(current: Record<string, string>) {
    if (!current.viability && !current.decision) return current

    return { ...current, viability: '', decision: '' }
  }

  function handleDynamicFormAnswerChange(fieldId: string, value: DynamicFormAnswerValue) {
    setDynamicFormAnswers((current) => ({ ...current, [fieldId]: value }))
    setValidationErrors((current) => {
      if (!current[`field:${fieldId}`]) return current
      const next = { ...current }
      delete next[`field:${fieldId}`]
      return next
    })
  }

  function handleClosureReasonChange(reason: IntakeClosureReason) {
    setClosureReason(reason)
    setClosureError(null)
  }

  function handleClosureNotesChange(notes: string) {
    setClosureNotes(notes)
    setClosureError(null)
  }

  return {
    consultation,
    isLoading,
    isError,
    error,
    isSubmitting,
    finalizationError,
    isAttendanceFinalized,
    isConsultationPending,
    isEditingAttendance,
    editAttendanceError,
    isAttendanceFormComplete,
    isFactModalOpen,
    isFormModalOpen,
    isClosureConfirmationOpen,
    closureReason,
    closureNotes,
    closureError,
    editingFact,
    mainLegalQuestionError,
    clientGuidanceError,
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
    setLegalAreaId,
    legalTopicId,
    setLegalTopicId,
    selectedForm,
    selectedFormName: selectedForm?.title ?? 'Triagem inicial',
    dynamicFormAnswers,
    handleDynamicFormAnswerChange,
    validationErrors,
    facts,
    claims,
    lawyerNotes,
    setLawyerNotes,
    mainLegalQuestion,
    setMainLegalQuestion: handleMainLegalQuestionChange,
    clientGuidance,
    setClientGuidance: handleClientGuidanceChange,
    viability,
    setViability: handleViabilityChange,
    decision,
    setDecision: handleDecisionChange,
    areasList,
    topicsList,
    currentAreaName,
    currentTopicName,
    handleSaveFact,
    handleSaveClaim,
    handleFinalize,
    handleOpenClosureConfirmation,
    handleClosureConfirmationChange,
    handleConfirmClosure,
    handleClosureReasonChange,
    handleClosureNotesChange,
    handleEditAttendance,
    handleOpenFactModal,
    handleEditFact,
    handleCloseFactModal,
    handleRemoveFact,
    handleRemoveClaim,
    handleChangeLegalArea,
    handleOpenFormModal,
    handleCloseFormModal,
    handleSelectForm,
  }
}
