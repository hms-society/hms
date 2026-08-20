import type { DynamicForm, DynamicFormAnswer } from '#shared/domain'
import { DynamicFormFieldType } from '#shared/domain'
import type {
  DatetimeProvider,
  DynamicFormsRepository,
  IdProvider,
  Broker,
  UseCase,
} from '#shared/interfaces'
import {
  CollaboratorProfile,
  type CollaboratorProfile as CollaboratorProfileValue,
} from '../../identity/domain/structures'

import type { Consultation } from '../domain/entities'
import { ConsultationLegalContextUpdatedEvent } from '../domain/events'
import {
  ConsultationAttendanceFinalizationError,
  ConsultationNotFoundError,
} from '../domain/errors'
import {
  ConsultationDecision,
  ConsultationModality,
  ConsultationStatus,
  ConsultationSuggestionStatus,
  ConsultationViability,
} from '../domain/structures'
import type { ConsultationsRepository } from '../interfaces'

export type FinalizeConsultationAttendanceRequest = {
  readonly consultationId: string
  readonly collaboratorId: string
  readonly collaboratorProfile: CollaboratorProfileValue
  readonly legalAreaId: string
  readonly legalTopicId: string
  readonly modality: ConsultationModality
  readonly channel?: string | null
  readonly primaryLegalQuestion: string
  readonly guidanceProvided: string
  readonly notes?: string | null
  readonly viability: ConsultationViability
  readonly decision: ConsultationDecision
  readonly relevantFacts?: readonly {
    readonly id?: string
    readonly description: string
    readonly date?: string | null
  }[]
  readonly potentialLegalRequests?: readonly {
    readonly title: string
    readonly summary?: string | null
  }[]
  readonly dynamicFormId?: string | null
  readonly answers?: readonly DynamicFormAnswer[]
}

export class FinalizeConsultationAttendanceUseCase
  implements UseCase<FinalizeConsultationAttendanceRequest, Consultation>
{
  constructor(
    private readonly consultationsRepository: ConsultationsRepository,
    private readonly dynamicFormsRepository: DynamicFormsRepository,
    private readonly datetimeProvider: DatetimeProvider,
    private readonly idProvider: IdProvider,
    private readonly broker: Broker,
  ) {}

  async execute(request: FinalizeConsultationAttendanceRequest) {
    const consultation = await this.consultationsRepository.findById(
      request.consultationId,
    )
    if (!consultation) throw new ConsultationNotFoundError()

    this.validateConsultationAccess(
      consultation,
      request.collaboratorId,
      request.collaboratorProfile,
    )
    this.validateConsultationContext(consultation, request)
    this.validateDecisionAndViability(request)

    const dynamicForm = await this.findDynamicForm(request.dynamicFormId)
    this.validateDynamicForm(dynamicForm, request.answers ?? [])

    const finalizedAt = this.datetimeProvider.now()
    const updated = await this.consultationsRepository.replace(request.consultationId, {
      legalAreaId: request.legalAreaId,
      legalTopicId: request.legalTopicId,
      primaryLegalQuestion: request.primaryLegalQuestion.trim(),
      guidanceProvided: request.guidanceProvided.trim(),
      notes: request.notes?.trim() || undefined,
      viability: request.viability.trim(),
      decision: request.decision.trim(),
      relevantFacts: request.relevantFacts?.map((fact) => ({
        id: fact.id ?? this.idProvider.generate(),
        description: fact.description.trim(),
        ...(fact.date ? { occurredOn: parseFactDate(fact.date) } : {}),
      })),
      potentialLegalRequests: request.potentialLegalRequests?.map((claim) => ({
        id: this.idProvider.generate(),
        description: [claim.title.trim(), claim.summary?.trim()]
          .filter(Boolean)
          .join(' — '),
      })),
      dynamicFormId: request.dynamicFormId ?? undefined,
      dynamicFormAnswers: request.answers ?? [],
      dynamicFormSnapshot: dynamicForm
        ? {
            dynamicFormId: dynamicForm.id,
            name: dynamicForm.name,
            description: dynamicForm.description,
            fields: dynamicForm.fields,
          }
        : undefined,
      attendanceFinalizedAt: finalizedAt,
      attendanceFinalizedByCollaboratorId: request.collaboratorId,
    })

    if (!updated) throw new ConsultationNotFoundError()

    if (
      consultation.legalAreaId !== request.legalAreaId ||
      consultation.legalTopicId !== request.legalTopicId
    ) {
      await this.broker.publish(
        new ConsultationLegalContextUpdatedEvent({
          consultationId: updated.id,
          intakeId: updated.intakeId,
          legalAreaId: request.legalAreaId,
          legalTopicId: request.legalTopicId,
          updatedBy: request.collaboratorId,
          occurredAt: finalizedAt,
        }),
      )
    }

    return updated
  }

  private validateConsultationAccess(
    consultation: Consultation,
    collaboratorId: string,
    collaboratorProfile: CollaboratorProfileValue,
  ) {
    if (
      collaboratorProfile !== CollaboratorProfile.Admin &&
      consultation.assignedLawyerId !== collaboratorId
    ) {
      throw new ConsultationAttendanceFinalizationError(
        'Somente o advogado associado ou um administrador pode finalizar a ficha de atendimento.',
      )
    }
  }

  private validateConsultationContext(
    consultation: Consultation,
    request: FinalizeConsultationAttendanceRequest,
  ) {
    if (consultation.status !== ConsultationStatus.Pending) {
      throw new ConsultationAttendanceFinalizationError(
        'A ficha só pode ser finalizada enquanto a consulta estiver pendente.',
      )
    }
    if (consultation.modality !== request.modality) {
      throw new ConsultationAttendanceFinalizationError(
        'A modalidade informada não corresponde à consulta.',
      )
    }
    if (
      consultation.modality === ConsultationModality.Virtual &&
      !request.channel?.trim()
    ) {
      throw new ConsultationAttendanceFinalizationError(
        'O canal é obrigatório para consultas virtuais.',
      )
    }
    if (
      consultation.suggestions.some(
        (suggestion) => suggestion.status === ConsultationSuggestionStatus.Pending,
      )
    ) {
      throw new ConsultationAttendanceFinalizationError(
        'Aceite ou rejeite todas as sugestões pendentes antes de finalizar a ficha.',
      )
    }
  }

  private validateDecisionAndViability(request: FinalizeConsultationAttendanceRequest) {
    const viability = request.viability.trim()
    const decision = request.decision.trim()
    const viabilityOptions = Object.values(ConsultationViability) as readonly string[]
    const decisionOptions = Object.values(ConsultationDecision) as readonly string[]

    if (!viabilityOptions.includes(viability)) {
      throw new ConsultationAttendanceFinalizationError(
        'Selecione uma classificação de viabilidade válida.',
      )
    }

    if (!decisionOptions.includes(decision)) {
      throw new ConsultationAttendanceFinalizationError(
        'Selecione uma decisão de encaminhamento válida.',
      )
    }

    if (
      decision === ConsultationDecision.CloseWithoutContract &&
      viability !== ConsultationViability.NotViable
    ) {
      throw new ConsultationAttendanceFinalizationError(
        'Para encerrar sem contratação, selecione a classificação "Inviável".',
      )
    }

    if (
      (decision === ConsultationDecision.ProceedToContracting ||
        decision === ConsultationDecision.NewConsultation) &&
      viability !== ConsultationViability.Viable &&
      viability !== ConsultationViability.ViableWithReservations
    ) {
      throw new ConsultationAttendanceFinalizationError(
        'Para esta decisão, selecione "Viável" ou "Viável com ressalvas".',
      )
    }
  }

  private async findDynamicForm(dynamicFormId?: string | null) {
    if (!dynamicFormId) return undefined
    const forms = await this.dynamicFormsRepository.list()
    const dynamicForm = forms.find((form) => form.id === dynamicFormId)
    if (!dynamicForm) {
      throw new ConsultationAttendanceFinalizationError(
        'A ficha dinâmica selecionada não está disponível.',
      )
    }
    if (dynamicForm.status !== 'available') {
      throw new ConsultationAttendanceFinalizationError(
        'A ficha dinâmica selecionada está indisponível.',
      )
    }
    return dynamicForm
  }

  private validateDynamicForm(
    dynamicForm: DynamicForm | undefined,
    answers: readonly DynamicFormAnswer[],
  ) {
    if (!dynamicForm) return

    const answersByFieldId = new Map(
      answers.map((answer) => [answer.fieldId, answer.value]),
    )
    const fieldIds = new Set(dynamicForm.fields.map((field) => field.id))
    if (answers.some((answer) => !fieldIds.has(answer.fieldId))) {
      throw new ConsultationAttendanceFinalizationError(
        'A resposta contém um campo que não pertence à ficha dinâmica selecionada.',
      )
    }

    for (const field of dynamicForm.fields) {
      const value = answersByFieldId.get(field.id)
      if (field.required && isEmptyAnswer(value)) {
        throw new ConsultationAttendanceFinalizationError(
          `Preencha o campo obrigatório "${field.label}".`,
        )
      }
      if (value !== undefined && !isValidFieldValue(field, value)) {
        throw new ConsultationAttendanceFinalizationError(
          `A resposta do campo "${field.label}" é inválida.`,
        )
      }
    }
  }
}

function isValidFieldValue(
  field: DynamicForm['fields'][number],
  value: DynamicFormAnswer['value'],
) {
  if (value === null) return !field.required
  if (field.type === DynamicFormFieldType.Boolean) return typeof value === 'boolean'
  if (
    field.type === DynamicFormFieldType.ShortText ||
    field.type === DynamicFormFieldType.LongText
  ) {
    return typeof value === 'string'
  }
  if (field.type === DynamicFormFieldType.Date) {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value))
  }
  if (field.type === DynamicFormFieldType.MultipleSelection) {
    if (!Array.isArray(value)) return false
    const allowedValues = new Set(field.options?.map((option) => option.value) ?? [])
    return value.every((selectedValue) => allowedValues.has(selectedValue))
  }
  return false
}

function isEmptyAnswer(value: DynamicFormAnswer['value'] | undefined) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim().length === 0) ||
    (Array.isArray(value) && value.length === 0)
  )
}

function parseFactDate(value: string) {
  const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (brazilianDate) {
    const [, day, month, year] = brazilianDate
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`)
  }
  return new Date(value)
}
