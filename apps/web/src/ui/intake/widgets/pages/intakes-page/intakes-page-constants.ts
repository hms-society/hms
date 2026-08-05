import {
  ContactChannel,
  IntakeListStatus,
  IntakeOrigin,
  IntakeStatus,
} from '@hms/core/intake/domain/structures'

export const INTAKE_STATUS_LABELS: Record<string, string> = {
  [IntakeListStatus.ConsultationScheduled]: 'Consulta agendada',
  [IntakeListStatus.ConsultationCompleted]: 'Consulta realizada',
  [IntakeListStatus.ViabilityRegistered]: 'Viabilidade registrada',
  [IntakeListStatus.InFormalization]: 'Em formalização',
  [IntakeListStatus.Contracted]: 'Contratado',
  [IntakeListStatus.ClosedWithoutContract]: 'Encerrado sem contratação',
  [IntakeStatus.Registered]: 'Registrado',
}

export const INTAKE_ORIGIN_LABELS: Record<string, string> = {
  [IntakeOrigin.Direct]: 'Contato direto',
  [IntakeOrigin.Referral]: 'Indicação',
  [IntakeOrigin.Website]: 'Site',
  [IntakeOrigin.SocialMedia]: 'Redes sociais',
  [IntakeOrigin.Other]: 'Outro',
}

export const INTAKE_CONTACT_CHANNEL_LABELS: Record<string, string> = {
  [ContactChannel.Whatsapp]: 'WhatsApp',
  [ContactChannel.Email]: 'E-mail',
  [ContactChannel.Phone]: 'Telefone',
  [ContactChannel.InPerson]: 'Presencial',
}

export const INTAKE_STATUS_TABS = [
  { value: undefined, label: 'Todos', countKey: 'all' },
  {
    value: IntakeListStatus.ConsultationScheduled,
    label: INTAKE_STATUS_LABELS[IntakeListStatus.ConsultationScheduled],
    countKey: IntakeListStatus.ConsultationScheduled,
  },
  {
    value: IntakeListStatus.ConsultationCompleted,
    label: INTAKE_STATUS_LABELS[IntakeListStatus.ConsultationCompleted],
    countKey: IntakeListStatus.ConsultationCompleted,
  },
  {
    value: IntakeListStatus.ViabilityRegistered,
    label: INTAKE_STATUS_LABELS[IntakeListStatus.ViabilityRegistered],
    countKey: IntakeListStatus.ViabilityRegistered,
  },
  {
    value: IntakeListStatus.InFormalization,
    label: INTAKE_STATUS_LABELS[IntakeListStatus.InFormalization],
    countKey: IntakeListStatus.InFormalization,
  },
  {
    value: IntakeListStatus.Contracted,
    label: INTAKE_STATUS_LABELS[IntakeListStatus.Contracted],
    countKey: IntakeListStatus.Contracted,
  },
  {
    value: IntakeListStatus.ClosedWithoutContract,
    label: INTAKE_STATUS_LABELS[IntakeListStatus.ClosedWithoutContract],
    countKey: IntakeListStatus.ClosedWithoutContract,
  },
] as const

export function formatIntakeDate(value: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
