export const IntakeUrgency = {
  Normal: 'normal',
  High: 'high',
  Urgent: 'urgent',
} as const

export type IntakeUrgency = (typeof IntakeUrgency)[keyof typeof IntakeUrgency]
